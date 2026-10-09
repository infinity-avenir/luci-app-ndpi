'use strict';
'require view';
'require poll';
'require rpc';
'require dom';
'require ui';

// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------
var REFRESH_INTERVAL = 5;
var MAX_CHART_POINTS = 60;
var ALERT_LIMIT = 50;

// ---------------------------------------------------------------
// ubus API bindings (rpcd backend: /usr/libexec/rpcd/ndpi)
// ---------------------------------------------------------------
var callGetStatus = rpc.declare({
	object: 'ndpi', method: 'getStatus', expect: { '': {} }
});
var callGetInterfaceStats = rpc.declare({
	object: 'ndpi', method: 'getInterfaceStats', expect: { '': {} }
});
var callGetProtocols = rpc.declare({
	object: 'ndpi', method: 'getProtocols', expect: { '': {} }
});
var callGetFlows = rpc.declare({
	object: 'ndpi', method: 'getFlows', expect: { '': {} }
});
var callGetAlerts = rpc.declare({
	object: 'ndpi', method: 'getAlerts', params: ['count'], expect: { '': {} }
});
var callGetTraffic = rpc.declare({
	object: 'ndpi', method: 'getTraffic', expect: { '': {} }
});
var callStartService = rpc.declare({
	object: 'ndpi', method: 'startService', expect: { '': {} }
});
var callStopService = rpc.declare({
	object: 'ndpi', method: 'stopService', expect: { '': {} }
});
var callRestartService = rpc.declare({
	object: 'ndpi', method: 'restartService', expect: { '': {} }
});

// ---------------------------------------------------------------
// State (reset on each render)
// ---------------------------------------------------------------
var trafficHistory = { labels: [], rx: [], tx: [] };
var currentTab = 'dashboard';

// ---------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------
function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	return '%1024mB'.format(bytes);
}

function formatUptime(seconds) {
	if (!seconds || seconds <= 0) return 'N/A';
	var d = Math.floor(seconds / 86400);
	var h = Math.floor((seconds % 86400) / 3600);
	var m = Math.floor((seconds % 3600) / 60);
	var s = Math.floor(seconds % 60);
	var parts = [];
	if (d > 0) parts.push(d + 'd');
	if (h > 0) parts.push(h + 'h');
	if (m > 0) parts.push(m + 'm');
	parts.push(s + 's');
	return parts.join(' ');
}

function formatTimestamp() {
	return new Date().toLocaleTimeString();
}

function formatNumber(n) {
	if (!n && n !== 0) return '0';
	return Number(n).toLocaleString();
}

// ---------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------
function setText(id, text) {
	var el = document.getElementById(id);
	if (el) el.textContent = text;
}

// ---------------------------------------------------------------
// Dashboard: update status KPI cards
// ---------------------------------------------------------------
function updateStatus(data) {
	if (!data) return;

	var running = !!data.running;
	var badge = document.getElementById('status-badge');
	if (badge) {
		badge.textContent = running ? _('Running') : _('Stopped');
		badge.className = 'ndpi-badge ' + (running ? 'ndpi-badge-ok' : 'ndpi-badge-err');
	}
	setText('status-pid', running ? (data.pid || 'N/A') : 'N/A');
	setText('status-uptime', running ? formatUptime(data.uptime) : 'N/A');
	setText('status-memory', running ? formatBytes((data.memory_rss || 0) * 1024) : 'N/A');

	// Update button states
	var startBtn = document.getElementById('btn-start');
	var stopBtn = document.getElementById('btn-stop');
	if (startBtn) startBtn.style.display = running ? 'none' : '';
	if (stopBtn) stopBtn.style.display = running ? '' : 'none';

	if (data.system_memory)
		updateSystemMemory(data.system_memory);
}

function updateSystemMemory(mem) {
	if (!mem) return;

	var total = mem.total || 0;
	var available = mem.available || 0;
	var used = total - available;
	var pct = total > 0 ? Math.round((used / total) * 100) : 0;

	setText('sys-mem-total', formatBytes(total * 1024));
	setText('sys-mem-used', formatBytes(used * 1024));
	setText('sys-mem-pct', pct + '%');

	var bar = document.getElementById('sys-mem-bar');
	if (bar) {
		bar.style.width = pct + '%';
		bar.className = 'ndpi-progress-fill' +
			(pct > 90 ? ' critical' : pct > 70 ? ' warning' : '');
	}
}

function updateInterfaceStats(stats) {
	if (!stats || stats.error) return;

	setText('iface-name', stats.interface || 'N/A');
	setText('iface-rx', formatBytes(stats.rx_bytes || 0));
	setText('iface-tx', formatBytes(stats.tx_bytes || 0));
	setText('iface-rx-pkt', formatNumber(stats.rx_packets));
	setText('iface-tx-pkt', formatNumber(stats.tx_packets));

	// Update traffic history for the rate chart
	trafficHistory.labels.push(formatTimestamp());
	trafficHistory.rx.push(stats.rx_bytes || 0);
	trafficHistory.tx.push(stats.tx_bytes || 0);

	if (trafficHistory.labels.length > MAX_CHART_POINTS) {
		trafficHistory.labels.shift();
		trafficHistory.rx.shift();
		trafficHistory.tx.shift();
	}

	drawTrafficChart();
}

// ---------------------------------------------------------------
// Protocol distribution bar chart
// ---------------------------------------------------------------
function updateProtocolChart(data) {
	var container = document.getElementById('protocol-chart');
	if (!container) return;

	var protocols = (data && Array.isArray(data.protocols)) ? data.protocols : [];
	var source = (data && data.source) || '';

	if (protocols.length === 0) {
		dom.content(container,
			E('p', { 'class': 'ndpi-muted', 'style': 'padding:8px;' },
				_('No protocol data yet. Make sure nDPI service is running and traffic is flowing.')));
		return;
	}

	// Sort by count descending, take top 10
	protocols.sort(function(a, b) { return (b.count || 0) - (a.count || 0); });
	var top = protocols.slice(0, 10);
	var maxCount = top[0].count || 1;

	var colors = [
		'#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
		'#0891b2', '#65a30d', '#c026d3', '#ea580c', '#4f46e5'
	];

	var sourceLabel = '';
	if (source === 'dpi_snapshot') sourceLabel = _('DPI Analysis');
	else if (source === 'xt_ndpi') sourceLabel = _('Kernel Module');
	else if (source === 'conntrack') sourceLabel = _('Conntrack (L4 only)');
	else if (source) sourceLabel = source;

	var children = [];
	if (sourceLabel) {
		children.push(E('div', { 'style': 'text-align:right;margin-bottom:6px;' }, [
			E('span', {
				'class': 'ndpi-badge ' + (source === 'conntrack' ? 'ndpi-badge-warn' : 'ndpi-badge-ok'),
				'style': 'font-size:10px;'
			}, sourceLabel)
		]));
	}

	children.push(E('div', { 'class': 'ndpi-proto-bars' }, top.map(function(p, i) {
		var pct = maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0;
		var detail = formatNumber(p.count);
		if (p.bytes && p.bytes > 0) detail += ' (' + formatBytes(p.bytes) + ')';
		return E('div', { 'class': 'ndpi-proto-row' }, [
			E('span', { 'class': 'ndpi-proto-name' }, p.protocol || _('Unknown')),
			E('div', { 'class': 'ndpi-proto-bar-wrap' }, [
				E('div', {
					'class': 'ndpi-proto-bar',
					'style': 'width:' + pct + '%;background:' + colors[i % colors.length]
				})
			]),
			E('span', { 'class': 'ndpi-proto-count' }, detail)
		]);
	})));

	dom.content(container, E([], children));
}

// ---------------------------------------------------------------
// Traffic rate chart (canvas-based)
// ---------------------------------------------------------------
function drawTrafficChart() {
	var canvas = document.getElementById('traffic-canvas');
	if (!canvas) return;

	var parent = canvas.parentElement;
	if (!parent) return;

	if (trafficHistory.rx.length < 2) {
		var ctx0 = canvas.getContext('2d');
		canvas.width = parent.clientWidth || 600;
		canvas.height = 140;
		ctx0.clearRect(0, 0, canvas.width, canvas.height);
		ctx0.fillStyle = '#f9fafb';
		ctx0.fillRect(0, 0, canvas.width, canvas.height);
		ctx0.fillStyle = '#9ca3af';
		ctx0.font = '13px system-ui, sans-serif';
		ctx0.textAlign = 'center';
		ctx0.fillText(_('Collecting traffic data...'), canvas.width / 2, 75);
		return;
	}

	var ctx = canvas.getContext('2d');
	var w = canvas.width = parent.clientWidth || 600;
	var h = canvas.height = 140;
	var pad = { top: 10, right: 10, bottom: 24, left: 60 };
	var plotW = w - pad.left - pad.right;
	var plotH = h - pad.top - pad.bottom;

	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = '#f9fafb';
	ctx.fillRect(0, 0, w, h);

	// Compute deltas (bytes/sec)
	var rxRate = [], txRate = [];
	for (var i = 1; i < trafficHistory.rx.length; i++) {
		var rxDelta = trafficHistory.rx[i] - trafficHistory.rx[i - 1];
		var txDelta = trafficHistory.tx[i] - trafficHistory.tx[i - 1];
		rxRate.push(Math.max(0, rxDelta) / REFRESH_INTERVAL);
		txRate.push(Math.max(0, txDelta) / REFRESH_INTERVAL);
	}

	if (rxRate.length === 0) return;

	var allVals = rxRate.concat(txRate);
	var maxVal = Math.max(1, Math.max.apply(null, allVals));

	// Grid lines
	ctx.strokeStyle = '#e5e7eb';
	ctx.lineWidth = 1;
	for (var g = 0; g <= 4; g++) {
		var gy = pad.top + plotH - (g / 4) * plotH;
		ctx.beginPath();
		ctx.moveTo(pad.left, gy);
		ctx.lineTo(w - pad.right, gy);
		ctx.stroke();

		ctx.fillStyle = '#6b7280';
		ctx.font = '10px system-ui, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText(formatBytes(maxVal * g / 4) + '/s', pad.left - 4, gy + 3);
	}

	function drawLine(data, color) {
		if (data.length < 2) return;
		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.lineJoin = 'round';
		data.forEach(function(val, idx) {
			var x = pad.left + (idx / (data.length - 1)) * plotW;
			var y = pad.top + plotH - (val / maxVal) * plotH;
			if (idx === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});
		ctx.stroke();
	}

	drawLine(rxRate, '#2563eb');
	drawLine(txRate, '#059669');

	// Legend
	ctx.font = '11px system-ui, sans-serif';
	ctx.textAlign = 'left';
	ctx.fillStyle = '#2563eb';
	ctx.fillText('RX', pad.left, h - 5);
	ctx.fillStyle = '#059669';
	ctx.fillText('TX', pad.left + 55, h - 5);

	var latestRx = rxRate[rxRate.length - 1] || 0;
	var latestTx = txRate[txRate.length - 1] || 0;
	ctx.fillStyle = '#2563eb';
	ctx.fillText(formatBytes(latestRx) + '/s', pad.left + 90, h - 5);
	ctx.fillStyle = '#059669';
	ctx.fillText(formatBytes(latestTx) + '/s', pad.left + 200, h - 5);
}

// ---------------------------------------------------------------
// Flows table
// ---------------------------------------------------------------
function updateFlows(flowData) {
	var container = document.getElementById('flow-table-body');
	if (!container) return;

	var flows = (flowData && Array.isArray(flowData.flows)) ? flowData.flows : [];
	var source = (flowData && flowData.source) || '';

	if (flows.length === 0) {
		var msg = _('No active flows detected.');
		if (!source || source === 'none')
			msg += ' ' + _('DPI snapshot initializing — data appears on next refresh.');
		dom.content(container,
			E('tr', {}, E('td', { 'colspan': '7', 'class': 'ndpi-muted' }, msg)));
		setText('flow-count', '0');
		return;
	}

	setText('flow-count', flows.length.toString());

	dom.content(container, E([], flows.slice(0, 100).map(function(f) {
		return E('tr', {}, [
			E('td', { 'class': 'ndpi-mono' }, f.src_ip || f.src || f['src.ip'] || ''),
			E('td', { 'class': 'ndpi-mono' }, f.dst_ip || f.dst || f['dst.ip'] || ''),
			E('td', {}, f.protocol || f.detected_protocol || f['detected.protocol.name'] || _('unknown')),
			E('td', {}, f.src_port || f['src.port'] || ''),
			E('td', {}, f.dst_port || f['dst.port'] || ''),
			E('td', {}, formatBytes(f.bytes || f['flow.bytes'] || 0)),
			E('td', {}, formatNumber(f.packets || f['flow.packets'] || 0))
		]);
	})));
}

// ---------------------------------------------------------------
// Alerts table
// ---------------------------------------------------------------
var severityLabels = {
	'info': _('info'),
	'warning': _('warning'),
	'error': _('error')
};

function updateAlerts(alertData) {
	var container = document.getElementById('alert-table-body');
	if (!container) return;

	var alerts = (alertData && Array.isArray(alertData.alerts)) ? alertData.alerts : [];

	if (alerts.length === 0) {
		dom.content(container,
			E('tr', {}, E('td', { 'colspan': '3', 'class': 'ndpi-muted' }, _('No alerts recorded'))));
		setText('alert-count', '0');
		return;
	}

	setText('alert-count', alerts.length.toString());

	dom.content(container, E([], alerts.slice(-ALERT_LIMIT).reverse().map(function(a, i) {
		var msg = a.message || '';
		var severity = 'info';
		if (/error|critical|fail/i.test(msg)) severity = 'error';
		else if (/warn/i.test(msg)) severity = 'warning';

		return E('tr', {}, [
			E('td', {}, i + 1),
			E('td', {}, E('span', {
				'class': 'ndpi-severity ndpi-severity-' + severity
			}, severityLabels[severity] || severity)),
			E('td', {}, msg)
		]);
	})));
}

// ---------------------------------------------------------------
// Live traffic / connections
// ---------------------------------------------------------------
function updateConnections(data) {
	var container = document.getElementById('conn-table-body');
	if (!container) return;

	var conns = (data && Array.isArray(data.connections)) ? data.connections : [];

	if (conns.length === 0) {
		dom.content(container,
			E('tr', {}, E('td', { 'colspan': '4', 'class': 'ndpi-muted' }, _('No active connections'))));
		return;
	}

	dom.content(container, E([], conns.slice(0, 50).map(function(c) {
		var proto = c.protocol || '';
		var src = c.src || '';
		var dst = c.dst || '';
		var state = c.state || '';

		// Fallback: parse from raw if structured fields are missing
		if (!proto && c.raw) {
			var raw = c.raw;
			var parts = raw.split(/\s+/);
			if (parts.length > 2) proto = parts[2] || '';
			var srcMatch = raw.match(/src=(\S+)/);
			var dstMatch = raw.match(/dst=(\S+)/);
			if (srcMatch && !src) src = srcMatch[1];
			if (dstMatch && !dst) dst = dstMatch[1];
			var stateMatch = raw.match(/\b(ESTABLISHED|TIME_WAIT|SYN_SENT|SYN_RECV|FIN_WAIT|CLOSE|CLOSE_WAIT|LAST_ACK|LISTEN)\b/);
			if (stateMatch && !state) state = stateMatch[1];
		}

		if (!proto && !src && !dst) return null;

		return E('tr', {}, [
			E('td', {}, proto),
			E('td', { 'class': 'ndpi-mono' }, src),
			E('td', { 'class': 'ndpi-mono' }, dst),
			E('td', {}, state ? E('span', { 'class': 'ndpi-badge ndpi-badge-ok' }, state) : '')
		]);
	})));
}

// ---------------------------------------------------------------
// Master refresh — fetches all data via ubus
// ---------------------------------------------------------------
function refreshData() {
	setText('last-refresh', formatTimestamp());

	callGetStatus().then(updateStatus).catch(function() {});
	callGetInterfaceStats().then(updateInterfaceStats).catch(function() {});

	if (currentTab === 'dashboard')
		callGetProtocols().then(updateProtocolChart).catch(function() {});
	if (currentTab === 'flows' || currentTab === 'dashboard')
		callGetFlows().then(updateFlows).catch(function() {});
	if (currentTab === 'alerts')
		callGetAlerts(ALERT_LIMIT).then(updateAlerts).catch(function() {});
	if (currentTab === 'traffic')
		callGetTraffic().then(updateConnections).catch(function() {});
}

return view.extend({
	serviceAction: function(action) {
		var call = { 'start': callStartService, 'stop': callStopService,
		             'restart': callRestartService }[action];
		if (!call) return;

		return call().then(function() {
			return new Promise(function(resolve) {
				setTimeout(function() {
					refreshData();
					resolve();
				}, 2000);
			});
		});
	},

	switchTab: function(tabName) {
		currentTab = tabName;
		document.querySelectorAll('.ndpi-tab-btn').forEach(function(btn) {
			btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
		});
		document.querySelectorAll('.ndpi-tab-panel').forEach(function(panel) {
			panel.hidden = panel.id !== 'tab-' + tabName;
		});
		refreshData();
	},

	render: function() {
		// Reset per-view state
		trafficHistory = { labels: [], rx: [], tx: [] };
		currentTab = 'dashboard';

		var view = E('div', { 'class': 'ndpi-container' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpi/css/ndpi.css') }),

			// Header
			E('div', { 'class': 'ndpi-header' }, [
				E('div', { 'class': 'ndpi-header-title' }, [
					E('div', {}, [
						E('h1', {}, _('nDPI Deep Packet Inspection')),
						E('p', { 'class': 'ndpi-header-subtitle' },
							_('Real-time traffic analysis & application protocol detection'))
					])
				]),
				E('div', { 'class': 'ndpi-header-actions' }, [
					E('span', { 'class': 'ndpi-refresh-info' }, [
						_('Last update:'), ' ',
						E('span', { 'id': 'last-refresh' }, '—')
					]),
					E('button', {
						'class': 'ndpi-btn ndpi-btn-success',
						'id': 'btn-start',
						'title': _('Start nDPI service'),
						'click': ui.createHandlerFn(this, 'serviceAction', 'start')
					}, '▶ ' + _('Start')),
					E('button', {
						'class': 'ndpi-btn ndpi-btn-danger',
						'id': 'btn-stop',
						'title': _('Stop nDPI service'),
						'click': ui.createHandlerFn(this, 'serviceAction', 'stop')
					}, '■ ' + _('Stop')),
					E('button', {
						'class': 'ndpi-btn ndpi-btn-primary',
						'id': 'btn-restart',
						'title': _('Restart nDPI service'),
						'click': ui.createHandlerFn(this, 'serviceAction', 'restart')
					}, '↻ ' + _('Restart'))
				])
			]),

			// Tab navigation
			E('div', { 'class': 'ndpi-tabs' }, [
				E('button', { 'class': 'ndpi-tab-btn active', 'data-tab': 'dashboard',
					'click': ui.createHandlerFn(this, 'switchTab', 'dashboard') }, _('Dashboard')),
				E('button', { 'class': 'ndpi-tab-btn', 'data-tab': 'flows',
					'click': ui.createHandlerFn(this, 'switchTab', 'flows') }, _('Active Flows')),
				E('button', { 'class': 'ndpi-tab-btn', 'data-tab': 'traffic',
					'click': ui.createHandlerFn(this, 'switchTab', 'traffic') }, _('Live Traffic')),
				E('button', { 'class': 'ndpi-tab-btn', 'data-tab': 'alerts',
					'click': ui.createHandlerFn(this, 'switchTab', 'alerts') }, _('Alerts'))
			]),

			// Tab: Dashboard
			E('div', { 'class': 'ndpi-tab-panel', 'id': 'tab-dashboard' }, [
				// KPI stat tiles
				E('div', { 'class': 'ndpi-grid ndpi-grid-4', 'style': 'margin-bottom:16px' }, [
					E('div', { 'class': 'ndpi-stat' }, [
						E('div', { 'class': 'ndpi-stat-icon blue' }, '⚙'),
						E('div', { 'class': 'ndpi-stat-label' }, _('Service Status')),
						E('div', { 'class': 'ndpi-stat-value' }, [
							E('span', { 'id': 'status-badge', 'class': 'ndpi-badge ndpi-badge-err' },
								_('Checking...'))
						])
					]),
					E('div', { 'class': 'ndpi-stat' }, [
						E('div', { 'class': 'ndpi-stat-icon green' }, '#'),
						E('div', { 'class': 'ndpi-stat-label' }, _('Process ID')),
						E('div', { 'class': 'ndpi-stat-value', 'id': 'status-pid' }, '—')
					]),
					E('div', { 'class': 'ndpi-stat' }, [
						E('div', { 'class': 'ndpi-stat-icon orange' }, '⏱'),
						E('div', { 'class': 'ndpi-stat-label' }, _('Uptime')),
						E('div', { 'class': 'ndpi-stat-value', 'id': 'status-uptime' }, '—')
					]),
					E('div', { 'class': 'ndpi-stat' }, [
						E('div', { 'class': 'ndpi-stat-icon purple' }, 'M'),
						E('div', { 'class': 'ndpi-stat-label' }, _('Memory Usage')),
						E('div', { 'class': 'ndpi-stat-value', 'id': 'status-memory' }, '—')
					])
				]),

				// System memory bar
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('h3', { 'class': 'ndpi-card-title' }, _('System Memory')),
						E('span', { 'class': 'ndpi-badge ndpi-badge-ok', 'id': 'sys-mem-pct' }, '—')
					]),
					E('div', { 'class': 'ndpi-card-body' }, [
						E('div', { 'class': 'ndpi-info-row' }, [
							E('span', { 'class': 'ndpi-info-label' }, _('Total Memory')),
							E('span', { 'class': 'ndpi-info-value', 'id': 'sys-mem-total' }, '—')
						]),
						E('div', { 'class': 'ndpi-info-row' }, [
							E('span', { 'class': 'ndpi-info-label' }, _('Used Memory')),
							E('span', { 'class': 'ndpi-info-value', 'id': 'sys-mem-used' }, '—')
						]),
						E('div', { 'class': 'ndpi-progress' }, [
							E('div', { 'class': 'ndpi-progress-fill', 'id': 'sys-mem-bar',
								'style': 'width:0%' })
						])
					])
				]),

				E('div', { 'class': 'ndpi-grid ndpi-grid-2' }, [
					// Interface stats card
					E('div', { 'class': 'ndpi-card' }, [
						E('div', { 'class': 'ndpi-card-header' }, [
							E('h3', { 'class': 'ndpi-card-title' }, _('Interface Traffic')),
							E('span', { 'class': 'ndpi-badge ndpi-badge-ok', 'id': 'iface-name' }, '—')
						]),
						E('div', { 'class': 'ndpi-card-body' }, [
							E('div', { 'class': 'ndpi-info-row' }, [
								E('span', { 'class': 'ndpi-info-label' }, _('RX Bytes')),
								E('span', { 'class': 'ndpi-info-value', 'id': 'iface-rx' }, '—')
							]),
							E('div', { 'class': 'ndpi-info-row' }, [
								E('span', { 'class': 'ndpi-info-label' }, _('TX Bytes')),
								E('span', { 'class': 'ndpi-info-value', 'id': 'iface-tx' }, '—')
							]),
							E('div', { 'class': 'ndpi-info-row' }, [
								E('span', { 'class': 'ndpi-info-label' }, _('RX Packets')),
								E('span', { 'class': 'ndpi-info-value', 'id': 'iface-rx-pkt' }, '—')
							]),
							E('div', { 'class': 'ndpi-info-row' }, [
								E('span', { 'class': 'ndpi-info-label' }, _('TX Packets')),
								E('span', { 'class': 'ndpi-info-value', 'id': 'iface-tx-pkt' }, '—')
							])
						])
					]),

					// Protocol distribution
					E('div', { 'class': 'ndpi-card' }, [
						E('div', { 'class': 'ndpi-card-header' }, [
							E('h3', { 'class': 'ndpi-card-title' }, _('Top Protocols'))
						]),
						E('div', { 'class': 'ndpi-card-body', 'id': 'protocol-chart' }, [
							E('p', { 'class': 'ndpi-muted' }, _('Loading protocol data...'))
						])
					])
				]),

				// Traffic rate chart
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('h3', { 'class': 'ndpi-card-title' }, _('Traffic Rate (bytes/sec)'))
					]),
					E('div', { 'class': 'ndpi-card-body' }, [
						E('div', { 'class': 'ndpi-chart-wrap' }, [
							E('canvas', { 'id': 'traffic-canvas' })
						])
					])
				])
			]),

			// Tab: Active Flows
			E('div', { 'class': 'ndpi-tab-panel', 'id': 'tab-flows', 'hidden': '' }, [
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('h3', { 'class': 'ndpi-card-title' }, _('Active Network Flows')),
						E('span', { 'class': 'ndpi-badge ndpi-badge-ok' }, [
							E('span', { 'id': 'flow-count' }, '0'), ' ', _('flows')
						])
					]),
					E('div', { 'class': 'ndpi-card-body' }, [
						E('div', { 'class': 'ndpi-table-wrap' }, [
							E('table', { 'class': 'ndpi-table' }, [
								E('thead', {}, E('tr', {}, [
									E('th', {}, _('Source IP')),
									E('th', {}, _('Destination IP')),
									E('th', {}, _('Protocol')),
									E('th', {}, _('Src Port')),
									E('th', {}, _('Dst Port')),
									E('th', {}, _('Bytes')),
									E('th', {}, _('Packets'))
								])),
								E('tbody', { 'id': 'flow-table-body' }, [
									E('tr', {}, E('td', { 'colspan': '7', 'class': 'ndpi-muted' },
										_('Loading...')))
								])
							])
						])
					])
				])
			]),

			// Tab: Live Traffic
			E('div', { 'class': 'ndpi-tab-panel', 'id': 'tab-traffic', 'hidden': '' }, [
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('h3', { 'class': 'ndpi-card-title' }, _('Live Connection Tracking'))
					]),
					E('div', { 'class': 'ndpi-card-body' }, [
						E('div', { 'class': 'ndpi-table-wrap' }, [
							E('table', { 'class': 'ndpi-table' }, [
								E('thead', {}, E('tr', {}, [
									E('th', {}, _('Protocol')),
									E('th', {}, _('Source')),
									E('th', {}, _('Destination')),
									E('th', {}, _('State'))
								])),
								E('tbody', { 'id': 'conn-table-body' }, [
									E('tr', {}, E('td', { 'colspan': '4', 'class': 'ndpi-muted' },
										_('Loading...')))
								])
							])
						])
					])
				])
			]),

			// Tab: Alerts
			E('div', { 'class': 'ndpi-tab-panel', 'id': 'tab-alerts', 'hidden': '' }, [
				E('div', { 'class': 'ndpi-card' }, [
					E('div', { 'class': 'ndpi-card-header' }, [
						E('h3', { 'class': 'ndpi-card-title' }, _('Security Alerts')),
						E('span', { 'class': 'ndpi-badge ndpi-badge-warn' }, [
							E('span', { 'id': 'alert-count' }, '0'), ' ', _('alerts')
						])
					]),
					E('div', { 'class': 'ndpi-card-body' }, [
						E('p', { 'style': 'font-size:12px;color:var(--ndpi-text-secondary);margin-bottom:12px;' },
							_('Auto-refreshes every 5 seconds. Showing last %d alerts.').format(ALERT_LIMIT)),
						E('div', { 'class': 'ndpi-table-wrap' }, [
							E('table', { 'class': 'ndpi-table' }, [
								E('thead', {}, E('tr', {}, [
									E('th', {}, '#'),
									E('th', {}, _('Severity')),
									E('th', {}, _('Message'))
								])),
								E('tbody', { 'id': 'alert-table-body' }, [
									E('tr', {}, E('td', { 'colspan': '3', 'class': 'ndpi-muted' },
										_('Loading alerts...')))
								])
							])
						])
					])
				])
			])
		]);

		poll.add(refreshData, REFRESH_INTERVAL);

		return view;
	},

	// This is a status page without form data - hide the action footer
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
