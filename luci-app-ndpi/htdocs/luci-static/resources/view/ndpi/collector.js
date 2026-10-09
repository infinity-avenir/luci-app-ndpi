'use strict';
'require view';
'require form';

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('ndpi',
			_('Flow Collection'),
			_('Configure ingestion of flow records from external sources. ' +
			  'nDPI can receive NetFlow (v5/v9), sFlow, and IPFIX from routers, ' +
			  'switches, and software agents like nProbe, enabling visibility ' +
			  'across your entire network — not just the local router.'));

		s = m.section(form.NamedSection, 'collector', 'flow_collection',
			_('Flow Collector'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Flow Collector'),
			_('Start listening for incoming flow records. ' +
			  'You must enable at least one protocol below (NetFlow, sFlow, or IPFIX).'));
		o.default = '0';

		o = s.option(form.Value, 'collector_interface', _('Listening Address'),
			_('IP address to bind the collector to. Use 0.0.0.0 to listen ' +
			  'on all interfaces, or a specific IP for tighter control.'));
		o.default = '0.0.0.0';
		o.datatype = 'ipaddr';

		s = m.section(form.NamedSection, 'collector', 'flow_collection',
			_('NetFlow'),
			_('NetFlow is Cisco\'s protocol for exporting IP flow information. ' +
			  'v5 is the classic fixed-format version; v9 is template-based and ' +
			  'supports IPv6 and MPLS. Most enterprise routers support NetFlow export.'));

		o = s.option(form.Flag, 'netflow_enabled', _('Enable NetFlow Receiver'));
		o.default = '0';

		o = s.option(form.Value, 'netflow_port', _('NetFlow UDP Port'),
			_('Port to listen on for incoming NetFlow datagrams.'));
		o.default = '2055';
		o.datatype = 'port';
		o.depends('netflow_enabled', '1');

		o = s.option(form.ListValue, 'netflow_version', _('NetFlow Version'),
			_('Protocol version to accept. v9 is recommended for modern networks.'));
		o.value('5', _('NetFlow v5 (fixed format)'));
		o.value('9', _('NetFlow v9 (template-based)'));
		o.value('both', _('Both v5 and v9'));
		o.default = '9';
		o.depends('netflow_enabled', '1');

		s = m.section(form.NamedSection, 'collector', 'flow_collection',
			_('sFlow'),
			_('sFlow samples a subset of packets at configurable rates and exports ' +
			  'the samples plus interface counters. It is widely supported by switches ' +
			  'from many vendors and scales well in high-throughput environments.'));

		o = s.option(form.Flag, 'sflow_enabled', _('Enable sFlow Receiver'));
		o.default = '0';

		o = s.option(form.Value, 'sflow_port', _('sFlow UDP Port'),
			_('Port to listen on for incoming sFlow datagrams.'));
		o.default = '6343';
		o.datatype = 'port';
		o.depends('sflow_enabled', '1');

		s = m.section(form.NamedSection, 'collector', 'flow_collection',
			_('IPFIX'),
			_('IPFIX (IP Flow Information Export) is the IETF standard successor ' +
			  'to NetFlow v9. It uses a flexible template mechanism and supports ' +
			  'enterprise-specific information elements for rich flow metadata.'));

		o = s.option(form.Flag, 'ipfix_enabled', _('Enable IPFIX Receiver'));
		o.default = '0';

		o = s.option(form.Value, 'ipfix_port', _('IPFIX UDP Port'),
			_('Port to listen on for incoming IPFIX datagrams.'));
		o.default = '4739';
		o.datatype = 'port';
		o.depends('ipfix_enabled', '1');

		return m.render();
	}
});
