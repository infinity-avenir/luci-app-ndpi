'use strict';
'require view';
'require form';

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('ndpi',
			_('Traffic Behavior Analysis'),
			_('Monitor periodic and recurring network flows to map active services ' +
			  'and detect anomalies. Behavioral analysis learns what \'normal\' looks like ' +
			  'for your network and alerts when traffic patterns deviate significantly.'));

		s = m.section(form.NamedSection, 'behavior', 'traffic_behavior',
			_('Behavior Engine'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Behavior Analysis'),
			_('Activate the traffic behavior monitoring engine. It runs in ' +
			  'the background, periodically scanning active flows for patterns.'));
		o.default = '1';

		o = s.option(form.Flag, 'periodic_scan', _('Periodic Flow Scanning'),
			_('Scan flows at regular intervals to identify periodic, recurring ' +
			  'connections such as NTP, heartbeats, polling, and cron-triggered traffic.'));
		o.default = '1';

		o = s.option(form.Value, 'scan_interval', _('Scan Interval (seconds)'),
			_('How often to run the periodic flow scanner. Lower values increase ' +
			  'detection speed but use more CPU on resource-constrained devices.'));
		o.default = '60';
		o.datatype = 'uinteger';

		o = s.option(form.Flag, 'anomaly_detection', _('Statistical Anomaly Detection'),
			_('Compare current traffic patterns against a learned baseline. ' +
			  'Alerts are raised when the deviation exceeds the configured threshold.'));
		o.default = '1';

		o = s.option(form.Value, 'baseline_hours', _('Baseline Window (hours)'),
			_('Number of hours of historical data to use as the normal baseline. ' +
			  'A longer window produces a more stable model but adapts more slowly.'));
		o.default = '24';
		o.datatype = 'uinteger';

		o = s.option(form.Value, 'deviation_threshold', _('Deviation Threshold (sigma)'),
			_('Number of standard deviations from the baseline mean that ' +
			  'triggers an anomaly alert. Typical values: 2 = sensitive, 3 = balanced, 5 = conservative.'));
		o.default = '3';
		o.datatype = 'ufloat';

		s = m.section(form.NamedSection, 'sites', 'site_hierarchy',
			_('Site Hierarchy'),
			_('Group hosts and networks into logical sites for dashboard views. ' +
			  'Inspired by ntopng 7.0\'s Sites feature, this allows you to see ' +
			  'traffic patterns organized by physical location or network segment.'));

		o = s.option(form.Flag, 'enabled', _('Enable Site Hierarchy'));
		o.default = '0';

		o = s.option(form.Value, 'site_name', _('Site Name'),
			_('A human-readable name for this network site.'));
		o.default = 'Default';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'group_mode', _('Grouping Mode'),
			_('How to organize hosts into the site view.'));
		o.value('subnet', _('By Subnet'));
		o.value('vlan', _('By VLAN'));
		o.value('interface', _('By Interface'));
		o.value('manual', _('Manual Assignment'));
		o.default = 'subnet';
		o.depends('enabled', '1');

		return m.render();
	}
});
