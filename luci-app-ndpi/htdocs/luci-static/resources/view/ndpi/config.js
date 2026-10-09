'use strict';
'require view';
'require form';
'require rpc';

var callGetInterfaces = rpc.declare({
	object: 'ndpi', method: 'getInterfaces', expect: { 'interfaces': [] }
});

return view.extend({
	load: function() {
		return L.resolveDefault(callGetInterfaces(), []);
	},

	render: function(ifaces) {
		var m, s, o;

		m = new form.Map('ndpi',
			_('nDPI General Configuration'),
			_('Configure the core nDPI deep packet inspection service. ' +
			  'nDPI identifies 450+ application protocols in real time, ' +
			  'including encrypted TLS/QUIC traffic via fingerprinting.'));

		s = m.section(form.NamedSection, 'global', 'ndpi', _('Global Settings'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable nDPI'),
			_('Start the nDPI deep packet inspection engine.'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'interface', _('Monitored Interface'),
			_('Network interface to capture and analyze traffic on.'));
		if (Array.isArray(ifaces))
			ifaces.forEach(function(ifname) {
				o.value(ifname, ifname);
			});
		o.default = 'br-lan';
		o.rmempty = false;

		o = s.option(form.ListValue, 'log_level', _('Log Verbosity'),
			_('Controls the detail level of nDPI diagnostic logging.'));
		o.value('0', _('Silent'));
		o.value('1', _('Normal'));
		o.value('2', _('Verbose'));
		o.value('3', _('Debug'));
		o.default = '1';

		o = s.option(form.Value, 'json_log', _('JSON Flow Log Path'),
			_('File path where nDPI writes real-time flow data in JSON format. ' +
			  'The dashboard reads from this file.'));
		o.default = '/tmp/ndpi_flows.json';
		o.datatype = 'string';

		o = s.option(form.Value, 'flow_max_packets', _('Max Packets per Flow'),
			_('Maximum number of packets to inspect per flow before ' +
			  'committing a protocol verdict. Higher = more accurate, slower.'));
		o.default = '10';
		o.datatype = 'uinteger';

		o = s.option(form.Flag, 'enable_guess', _('Enable Protocol Guessing'),
			_('When nDPI cannot identify a protocol with certainty, ' +
			  'use heuristics to make an educated guess.'));
		o.default = '1';

		o = s.option(form.Flag, 'decode_tunnels', _('Decode Tunnels'),
			_('Inspect traffic inside GRE, VXLAN, IP-in-IP, and other ' +
			  'tunnel encapsulations to classify the inner payload.'));
		o.default = '1';

		o = s.option(form.Flag, 'track_payload', _('Track Payload'),
			_('Store a portion of the packet payload alongside flow data. ' +
			  'Useful for debugging, but increases memory and CPU usage.'));
		o.default = '0';

		return m.render();
	}
});
