'use strict';
'require view';
'require form';

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('ndpi',
			_('Alerts & Security'),
			_('Configure security alerting, SIEM integration, and threat detection. ' +
			  'nDPI can detect port scans, SYN floods, DNS tunneling, and other ' +
			  'suspicious network behavior patterns.'));

		s = m.section(form.NamedSection, 'alerts', 'security',
			_('Alert Configuration'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Alerting'),
			_('Turn on the alert engine. When active, nDPI raises alerts ' +
			  'for security events, threshold breaches, and anomalous traffic.'));
		o.default = '1';

		o = s.option(form.Value, 'max_alerts', _('Max Stored Alerts'),
			_('Maximum number of alerts to keep in memory. Oldest alerts ' +
			  'are discarded when this limit is reached.'));
		o.default = '500';
		o.datatype = 'uinteger';

		o = s.option(form.Value, 'alert_log', _('Alert Log File'),
			_('Path to the file where alerts are written. The dashboard ' +
			  'reads the last 50 entries from this file.'));
		o.default = '/tmp/ndpi_alerts.log';
		o.datatype = 'string';

		o = s.option(form.Flag, 'syslog_enabled', _('Log to Syslog'),
			_('Forward alerts to the system log (logread). Useful for ' +
			  'centralized log collection and SIEM integration.'));
		o.default = '1';

		s = m.section(form.NamedSection, 'alerts', 'security',
			_('Notification Settings'));

		o = s.option(form.Flag, 'email_enabled', _('Email Notifications'),
			_('Send email notifications for critical alerts. Requires ' +
			  'a working SMTP configuration on the router (e.g., msmtp).'));
		o.default = '0';

		o = s.option(form.Value, 'email_recipient', _('Recipient Email'),
			_('Email address to receive alert notifications.'));
		o.datatype = 'string';
		o.depends('email_enabled', '1');

		s = m.section(form.NamedSection, 'alerts', 'security',
			_('Threshold Alerts'));

		o = s.option(form.Value, 'threshold_bandwidth', _('Bandwidth Threshold (bytes/sec)'),
			_('Alert when a single host exceeds this bandwidth. ' +
			  'Set to 0 to disable this check.'));
		o.default = '0';
		o.datatype = 'uinteger';

		o = s.option(form.Value, 'threshold_connections', _('Connection Count Threshold'),
			_('Alert when a single host has more than this many concurrent ' +
			  'connections. Can indicate a compromised device or P2P activity.'));
		o.default = '1000';
		o.datatype = 'uinteger';

		s = m.section(form.NamedSection, 'alerts', 'security',
			_('Security Detection'),
			_('nDPI can detect various network attacks and suspicious behaviors. ' +
			  'These integrate with MITRE ATT&CK tactics for security analysts.'));

		o = s.option(form.Flag, 'detect_port_scan', _('Port Scan Detection'),
			_('Detect hosts that probe many ports in quick succession. ' +
			  'Maps to MITRE ATT&CK T1046 (Network Service Scanning).'));
		o.default = '1';

		o = s.option(form.Flag, 'detect_syn_flood', _('SYN Flood Detection'),
			_('Detect TCP SYN flood denial-of-service patterns. ' +
			  'Maps to MITRE ATT&CK T1498 (Network Denial of Service).'));
		o.default = '1';

		o = s.option(form.Flag, 'detect_dns_tunnel', _('DNS Tunneling Detection'),
			_('Detect DNS queries with unusually long or encoded subdomains, ' +
			  'which may indicate data exfiltration or C2 tunneling over DNS. ' +
			  'Maps to MITRE ATT&CK T1071.004 (DNS-based Application Layer Protocol).'));
		o.default = '1';

		return m.render();
	}
});
