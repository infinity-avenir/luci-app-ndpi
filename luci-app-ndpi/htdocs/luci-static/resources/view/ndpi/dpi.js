'use strict';
'require view';
'require form';

// ---------------------------------------------------------------
// nDPI 6.0 protocol catalog, organized by category.
// Each entry: [uci key suffix, display label]
// The UCI option name is "proto_" + lowercase key.
// ---------------------------------------------------------------
var PROTOCOL_CATEGORIES = [
	[ _('Web & HTTP Protocols'), _('HTTP, HTTPS, web browsers and web-based services.'), [
		['HTTP', 'HTTP'], ['HTTP2', 'HTTP/2'], ['HTTP_CONNECT', 'HTTP CONNECT'],
		['HTTP_PROXY', 'HTTP Proxy'], ['TLS', 'TLS/SSL'], ['DTLS', 'DTLS'],
		['QUIC', 'QUIC (HTTP/3)'], ['HLS', 'HLS (HTTP Live Streaming)'],
		['MPEGDASH', 'MPEG-DASH'], ['MPEGTS', 'MPEG-TS'], ['WEBSOCKET', 'WebSocket'],
		['WEBDAV', 'WebDAV'], ['FASTCGI', 'FastCGI'], ['SOAP', 'SOAP'],
		['JSON_RPC', 'JSON-RPC'], ['PROTOBUF', 'Protocol Buffers'],
		['MSGPACK', 'MessagePack'], ['SOCKS', 'SOCKS Proxy'], ['OCSP', 'OCSP']
	]],
	[ _('DNS Protocols'), _('Domain Name System protocols including encrypted variants.'), [
		['DNS', 'DNS'], ['DOH_DOT', 'DNS-over-HTTPS / DNS-over-TLS'],
		['DNSCRYPT', 'DNSCrypt'], ['MDNS', 'mDNS (Multicast DNS)'],
		['LLMNR', 'LLMNR'], ['OPENDNS', 'OpenDNS'],
		['AVAST_SECUREDNS', 'Avast SecureDNS']
	]],
	[ _('Email Protocols'), _('Email sending and receiving protocols.'), [
		['MAIL_SMTP', 'SMTP'], ['MAIL_SMTPS', 'SMTPS (SMTP over TLS)'],
		['MAIL_IMAP', 'IMAP'], ['MAIL_IMAPS', 'IMAPS (IMAP over TLS)'],
		['MAIL_POP', 'POP3'], ['MAIL_POPS', 'POP3S (POP3 over TLS)']
	]],
	[ _('VoIP & Video Conferencing'), _('Voice-over-IP, video calls and conferencing protocols.'), [
		['SIP', 'SIP'], ['SKINNY', 'Skinny (SCCP)'], ['H323', 'H.323'],
		['IAX', 'IAX (Asterisk)'], ['MGCP', 'MGCP'], ['MEGACO', 'Megaco/H.248'],
		['RTP', 'RTP'], ['RTCP', 'RTCP'], ['SRTP', 'SRTP'], ['STUN', 'STUN'],
		['NOE', 'NOE (Alcatel)'], ['BFCP', 'BFCP'], ['ZOOM', 'Zoom'],
		['MSTEAMS', 'Microsoft Teams'], ['MSTEAMS_CALL', 'Microsoft Teams Call'],
		['GOOGLE_MEET', 'Google Meet'], ['GOOGLE_CALL', 'Google Call'],
		['WEBEX', 'Webex'], ['GOTO', 'GoTo Meeting'], ['FUZE', 'Fuze'],
		['PALTALK', 'Paltalk'], ['MUMBLE', 'Mumble'], ['TEAMSPEAK', 'TeamSpeak'],
		['VIVOX', 'Vivox'], ['DISCORD_CALL', 'Discord Call']
	]],
	[ _('Messaging & Chat'), _('Instant messaging and chat applications.'), [
		['WHATSAPP', 'WhatsApp'], ['WHATSAPP_CALL', 'WhatsApp Call'],
		['WHATSAPP_FILES', 'WhatsApp Files'], ['TELEGRAM', 'Telegram'],
		['TELEGRAM_VOIP', 'Telegram VoIP'], ['SIGNAL', 'Signal'],
		['SIGNAL_VOIP', 'Signal VoIP'], ['THREEMA', 'Threema'], ['LINE', 'LINE'],
		['LINE_CALL', 'LINE Call'], ['VIBER', 'Viber'],
		['VIBER_VOIP', 'Viber VoIP'], ['WECHAT', 'WeChat'],
		['KAKAOTALK', 'KakaoTalk'], ['KAKAOTALK_VOICE', 'KakaoTalk Voice'],
		['SLACK', 'Slack'], ['DISCORD', 'Discord'], ['JABBER', 'Jabber/XMPP'],
		['IRC', 'IRC'], ['IMO', 'imo'], ['DINGTALK', 'DingTalk'],
		['GOOGLE_CHAT', 'Google Chat'],
		['FACEBOOK_MESSENGER', 'Facebook Messenger']
	]],
	[ _('Social Media'), _('Social networking platforms.'), [
		['FACEBOOK', 'Facebook'], ['FACEBOOK_REEL_STORY', 'Facebook Reel/Story'],
		['FACEBOOK_VOIP', 'Facebook VoIP'], ['INSTAGRAM', 'Instagram'],
		['TWITTER', 'Twitter/X'], ['THREADS', 'Threads'], ['TIKTOK', 'TikTok'],
		['SNAPCHAT', 'Snapchat'], ['SNAPCHAT_CALL', 'Snapchat Call'],
		['REDDIT', 'Reddit'], ['PINTEREST', 'Pinterest'], ['LINKEDIN', 'LinkedIn'],
		['TUMBLR', 'Tumblr'], ['VK', 'VK'], ['BADOO', 'Badoo'], ['LIKEE', 'Likee'],
		['MASTODON', 'Mastodon'], ['BLUESKY', 'Bluesky'],
		['SINA_WEIBO', 'Sina Weibo'], ['QQ', 'QQ'], ['OICQ', 'OICQ']
	]],
	[ _('Streaming & Media'), _('Audio and video streaming services.'), [
		['NETFLIX', 'Netflix'], ['YOUTUBE', 'YouTube'],
		['YOUTUBE_KIDS', 'YouTube Kids'], ['YOUTUBE_UPLOAD', 'YouTube Upload'],
		['AMAZON_VIDEO', 'Amazon Prime Video'], ['DISNEYPLUS', 'Disney+'],
		['HBO', 'HBO Max'], ['HULU', 'Hulu'], ['PARAMOUNTPLUS', 'Paramount+'],
		['APPLETVPLUS', 'Apple TV+'], ['DAZN', 'DAZN'], ['ESPN', 'ESPN'],
		['DIRECTV', 'DirecTV'], ['SHOWTIME', 'Showtime'], ['VUDU', 'Vudu'],
		['TWITCH', 'Twitch'], ['KICK', 'Kick'], ['DAILYMOTION', 'Dailymotion'],
		['VIMEO', 'Vimeo'], ['RUMBLE', 'Rumble'], ['RUTUBE', 'Rutube'],
		['LIVESTREAM', 'Livestream'], ['IQIYI', 'iQIYI'], ['IFLIX', 'iflix'],
		['TENCENTVIDEO', 'Tencent Video'], ['SPOTIFY', 'Spotify'],
		['DEEZER', 'Deezer'], ['SOUNDCLOUD', 'SoundCloud'], ['TIDAL', 'Tidal'],
		['PANDORA', 'Pandora'], ['IHEARTRADIO', 'iHeartRadio'],
		['LASTFM', 'Last.fm'], ['TUNEIN', 'TuneIn'], ['ICECAST', 'Icecast'],
		['RTMP', 'RTMP'], ['RTSP', 'RTSP'], ['SONOS', 'Sonos']
	]],
	[ _('Cloud Services & Providers'), _('Major cloud platforms and CDN services.'), [
		['AMAZON_AWS', 'Amazon AWS'], ['AWS_S3', 'AWS S3'], ['AWS_EC2', 'AWS EC2'],
		['AWS_CLOUDFRONT', 'AWS CloudFront'], ['AWS_API_GATEWAY', 'AWS API Gateway'],
		['AWS_COGNITO', 'AWS Cognito'], ['AWS_DYNAMODB', 'AWS DynamoDB'],
		['AWS_EMR', 'AWS EMR'], ['AWS_KINESIS', 'AWS Kinesis'],
		['MICROSOFT_AZURE', 'Microsoft Azure'], ['GOOGLE_CLOUD', 'Google Cloud'],
		['CLOUDFLARE', 'Cloudflare'], ['CLOUDFLARE_WARP', 'Cloudflare WARP'],
		['AKAMAI', 'Akamai'], ['EDGECAST', 'Edgecast'], ['CACHEFLY', 'CacheFly'],
		['DIGITALOCEAN', 'DigitalOcean'], ['ALICLOUD', 'Alibaba Cloud'],
		['HUAWEI_CLOUD', 'Huawei Cloud'], ['YANDEX_CLOUD', 'Yandex Cloud'],
		['SALESFORCE', 'Salesforce'], ['DROPBOX', 'Dropbox'],
		['MS_ONE_DRIVE', 'Microsoft OneDrive'], ['GOOGLE_DRIVE', 'Google Drive'],
		['APPLE_ICLOUD', 'Apple iCloud'],
		['ICLOUD_PRIVATE_RELAY', 'iCloud Private Relay'],
		['GOOGLE_DOCS', 'Google Docs']
	]],
	[ _('Big Tech & Platform Traffic'), _('Traffic from major technology companies and platforms.'), [
		['GOOGLE', 'Google'], ['GOOGLE_SERVICES', 'Google Services'],
		['GOOGLE_MAPS', 'Google Maps'], ['GOOGLE_CLASSROOM', 'Google Classroom'],
		['GMAIL', 'Gmail'], ['PLAYSTORE', 'Google Play Store'],
		['APPLE', 'Apple'], ['APPLE_PUSH', 'Apple Push Notification'],
		['APPLE_SIRI', 'Apple Siri'], ['APPLE_ITUNES', 'Apple iTunes'],
		['APPLESTORE', 'Apple App Store'], ['MICROSOFT', 'Microsoft'],
		['MICROSOFT_365', 'Microsoft 365'], ['MS_OUTLOOK', 'Microsoft Outlook'],
		['WINDOWS_UPDATE', 'Windows Update'],
		['MSDO', 'Microsoft Delivery Optimization'], ['AMAZON', 'Amazon'],
		['AMAZON_ALEXA', 'Amazon Alexa'], ['ALIBABA', 'Alibaba'],
		['TAOBAO', 'Taobao'], ['TEMU', 'Temu'], ['SHEIN', 'Shein'],
		['EBAY', 'eBay'], ['YAHOO', 'Yahoo'], ['MOZILLA', 'Mozilla'],
		['WIKIPEDIA', 'Wikipedia'], ['BLOOMBERG', 'Bloomberg'],
		['PLURALSIGHT', 'Pluralsight'], ['PASTEBIN', 'Pastebin'],
		['HUAWEI', 'Huawei'], ['XIAOMI', 'Xiaomi'], ['SAMSUNG_SDP', 'Samsung SDP'],
		['TENCENT', 'Tencent'], ['NAVER', 'Naver'], ['SINA', 'Sina'],
		['WAZE', 'Waze'], ['CANONICAL', 'Canonical/Ubuntu']
	]],
	[ _('Developer & Code Platforms'), _('Source code hosting, CI/CD and developer tools.'), [
		['GITHUB', 'GitHub'], ['GITHUB_ACTIONS', 'GitHub Actions'],
		['GITHUB_COPILOT', 'GitHub Copilot'], ['GITHUB_PACKAGES', 'GitHub Packages'],
		['GITLAB', 'GitLab'], ['GIT', 'Git']
	]],
	[ _('VPN & Tunneling'), _('VPN services and tunnel protocols.'), [
		['OPENVPN', 'OpenVPN'], ['WIREGUARD', 'WireGuard'], ['IPSEC', 'IPsec'],
		['PPTP', 'PPTP'], ['CISCOVPN', 'Cisco VPN (AnyConnect)'],
		['FORTICLIENT', 'FortiClient VPN'], ['SOFTETHER', 'SoftEther'],
		['TAILSCALE', 'Tailscale'], ['NORDVPN', 'NordVPN'],
		['PROTONVPN', 'ProtonVPN'], ['SURFSHARK', 'Surfshark'],
		['MULLVAD', 'Mullvad VPN'], ['PIA', 'Private Internet Access'],
		['OPERA_VPN', 'Opera VPN'], ['HOTSPOT_SHIELD', 'Hotspot Shield'],
		['TUNNELBEAR', 'TunnelBear'], ['WINDSCRIBE', 'Windscribe'],
		['CACTUSVPN', 'CactusVPN'], ['ULTRASURF', 'Ultrasurf'],
		['PSIPHON', 'Psiphon'], ['HAMACHI', 'Hamachi'], ['TINC', 'tinc'],
		['NEBULA', 'Nebula'], ['YGGDRASIL', 'Yggdrasil'], ['TOR', 'Tor'],
		['VXLAN', 'VXLAN'], ['TEREDO', 'Teredo'], ['IP_GRE', 'GRE'],
		['IP_IP_IN_IP', 'IP-in-IP'], ['IP_ESP', 'ESP'], ['IP_AH', 'AH']
	]],
	[ _('Remote Access & Desktop'), _('Remote desktop and screen-sharing protocols.'), [
		['SSH', 'SSH'], ['TELNET', 'Telnet'], ['RDP', 'RDP (Remote Desktop)'],
		['VNC', 'VNC'], ['TEAMVIEWER', 'TeamViewer'], ['ANYDESK', 'AnyDesk'],
		['NOMACHINE', 'NoMachine'], ['RADMIN', 'Radmin'], ['CITRIX', 'Citrix'],
		['XDMCP', 'XDMCP'], ['RSH', 'RSH']
	]],
	[ _('File Transfer'), _('File transfer and synchronization protocols.'), [
		['FTP_CONTROL', 'FTP Control'], ['FTP_DATA', 'FTP Data'],
		['FTPS', 'FTPS (FTP over TLS)'], ['TFTP', 'TFTP'], ['NFS', 'NFS'],
		['SMBV1', 'SMBv1'], ['SMBV23', 'SMBv2/v3'], ['AFP', 'AFP (Apple Filing)'],
		['RSYNC', 'rsync'], ['SYNCTHING', 'Syncthing'], ['UFTP', 'UFTP']
	]],
	[ _('Peer-to-Peer'), _('P2P file sharing and distributed protocols.'), [
		['BITTORRENT', 'BitTorrent'], ['EDONKEY', 'eDonkey'],
		['GNUTELLA', 'Gnutella'], ['USENET', 'Usenet (NNTP)'], ['LIBP2P', 'libp2p']
	]],
	[ _('Gaming'), _('Online gaming platforms and game protocols.'), [
		['STEAM', 'Steam'], ['EPICGAMES', 'Epic Games'], ['XBOX', 'Xbox'],
		['PLAYSTATION', 'PlayStation'], ['NINTENDO', 'Nintendo'],
		['ROBLOX', 'Roblox'], ['RIOTGAMES', 'Riot Games (LoL, Valorant)'],
		['BLIZZARD', 'Blizzard (Battle.net)'], ['ELECTRONICARTS', 'Electronic Arts'],
		['ACTIVISION', 'Activision'], ['ROCKSTAR_GAMES', 'Rockstar Games'],
		['DOTA2', 'Dota 2'], ['WORLDOFWARCRAFT', 'World of Warcraft'],
		['GUILDWARS2', 'Guild Wars 2'], ['TESO', 'The Elder Scrolls Online'],
		['HOTS', 'Heroes of the Storm'], ['PATHOFEXILE', 'Path of Exile'],
		['AMONG_US', 'Among Us'], ['FREEFIRE', 'Free Fire'],
		['COD_MOBILE', 'Call of Duty Mobile'], ['GENSHIN_IMPACT', 'Genshin Impact'],
		['LOLWILDRIFT', 'LoL Wild Rift'], ['TOCA_BOCA', 'Toca Boca'],
		['CROSSFIRE', 'Crossfire'], ['DOFUS', 'Dofus'],
		['ARMAGETRON', 'Armagetron'], ['SOURCE_ENGINE', 'Source Engine'],
		['VALVE_SDR', 'Valve SDR'], ['RAKNET', 'RakNet'],
		['GAIJIN', 'Gaijin (War Thunder)'], ['NEXON', 'Nexon'],
		['NETEASE_GAMES', 'NetEase Games'], ['TENCENTGAMES', 'Tencent Games'],
		['I3D', 'i3D.net']
	]],
	[ _('Cloud Gaming & Streaming'), _('Cloud gaming and game streaming services.'), [
		['GEFORCENOW', 'GeForce Now'], ['BLACKNUT', 'Blacknut'],
		['BOOSTEROID', 'Boosteroid']
	]],
	[ _('Cryptocurrency & Mining'), _('Cryptocurrency protocols and mining traffic.'), [
		['BITCOIN', 'Bitcoin'], ['ETHEREUM', 'Ethereum'], ['MONERO', 'Monero'],
		['MINING', 'Mining (Generic)'], ['NANO', 'Nano']
	]],
	[ _('Network Infrastructure'), _('Core network and infrastructure protocols.'), [
		['NTP', 'NTP'], ['SNMP', 'SNMP'], ['SYSLOG', 'Syslog'], ['DHCP', 'DHCP'],
		['DHCPV6', 'DHCPv6'], ['LDAP', 'LDAP'], ['KERBEROS', 'Kerberos'],
		['RADIUS', 'RADIUS'], ['NETBIOS', 'NetBIOS'], ['SSDP', 'SSDP'],
		['WSD', 'WSD'], ['NETFLOW', 'NetFlow'], ['SFLOW', 'sFlow'],
		['BGP', 'BGP'], ['OSPF', 'OSPF'], ['IP_OSPF', 'IP OSPF'], ['LDP', 'LDP'],
		['LISP', 'LISP'], ['OPENFLOW', 'OpenFlow'], ['CAPWAP', 'CAPWAP'],
		['IP_ICMP', 'ICMP'], ['IP_ICMPV6', 'ICMPv6'], ['IP_IGMP', 'IGMP'],
		['IP_SCTP', 'SCTP'], ['IP_PGM', 'PGM'], ['IP_PIM', 'PIM'],
		['IP_EGP', 'EGP'], ['IP_VRRP', 'VRRP'], ['HSRP', 'HSRP'],
		['GLBP', 'GLBP'], ['BFD', 'BFD'], ['CPHA', 'CPHA (Check Point HA)'],
		['DLEP', 'DLEP'], ['NATPMP', 'NAT-PMP'], ['WHOIS_DAS', 'WHOIS/DAS'],
		['Z3950', 'Z39.50'], ['IPP', 'IPP (Printing)'],
		['BJNP', 'BJNP (Canon Printing)'], ['GTP', 'GTP'], ['GTP_C', 'GTP-C'],
		['GTP_U', 'GTP-U'], ['GTP_PRIME', 'GTP Prime'], ['PFCP', 'PFCP'],
		['DIAMETER', 'Diameter'], ['SERVICE_LOCATION', 'SLP (Service Location)'],
		['DCERPC', 'DCE/RPC'], ['MS_RPCH', 'MS RPC over HTTP'], ['SMPP', 'SMPP']
	]],
	[ _('Database Protocols'), _('Database and data store access protocols.'), [
		['MYSQL', 'MySQL'], ['POSTGRES', 'PostgreSQL'],
		['MSSQL_TDS', 'MS SQL Server (TDS)'], ['ORACLE', 'Oracle DB'],
		['MONGODB', 'MongoDB'], ['CASSANDRA', 'Cassandra'],
		['ELASTICSEARCH', 'Elasticsearch'], ['CLICKHOUSE', 'ClickHouse'],
		['DRDA', 'DRDA (DB2)'], ['REDIS', 'Redis'],
		['RESP', 'RESP (Redis Protocol)'], ['MEMCACHED', 'Memcached'],
		['CEPH', 'Ceph'], ['LUSTRE', 'Lustre']
	]],
	[ _('Message Queues & Middleware'), _('Message brokers, queues and middleware protocols.'), [
		['MQTT', 'MQTT'], ['AMQP', 'AMQP'], ['APACHE_KAFKA', 'Apache Kafka'],
		['APACHE_THRIFT', 'Apache Thrift'], ['ZMQ', 'ZeroMQ'], ['NATS', 'NATS'],
		['STOMP', 'STOMP'], ['OPENWIRE', 'OpenWire (ActiveMQ)'],
		['GEARMAN', 'Gearman'], ['COLLECTD', 'collectd'], ['MUNIN', 'Munin'],
		['ZABBIX', 'Zabbix'], ['CHECKMK', 'Checkmk']
	]],
	[ _('Industrial Control Systems (ICS/SCADA)'),
	  _('Industrial automation, SCADA, and OT protocols. ' +
	    'Critical for securing operational technology networks.'), [
		['MODBUS', 'Modbus'], ['S7COMM', 'S7comm (Siemens S7)'],
		['S7COMM_PLUS', 'S7comm Plus'], ['PROFINET_IO', 'PROFINET IO'],
		['OPC_UA', 'OPC-UA'], ['IEC60870', 'IEC 60870-5-104'],
		['IEC62056', 'IEC 62056 (DLMS/COSEM)'],
		['IEEE_C37118', 'IEEE C37.118 (Synchrophasor)'], ['BACNET', 'BACnet'],
		['KNXNET_IP', 'KNXnet/IP'], ['DNP3', 'DNP3'],
		['ETHERNET_IP', 'EtherNet/IP'], ['CIP', 'CIP (Common Industrial)'],
		['SOMEIP', 'SOME/IP'], ['ISO9506_1_MMS', 'MMS (ISO 9506)'],
		['TRISTATION', 'TriStation'], ['UMAS', 'UMAS'], ['FINS', 'FINS (Omron)'],
		['MELSEC', 'MELSEC (Mitsubishi)'], ['BECKHOFF_ADS', 'Beckhoff ADS/AMS'],
		['HART_IP', 'HART-IP'], ['CNP_IP', 'CNP/IP'], ['C1222', 'C12.22 (ANSI)'],
		['TRDP', 'TRDP (Train Protocol)'], ['ETHERSBUS', 'EtherSBus'],
		['ETHERSIO', 'EtherSIO'], ['CAN', 'CAN bus'],
		['TARGUS_GETDATA', 'Targus Getdata'], ['ATG', 'ATG (Tank Gauging)'],
		['PTPV2', 'PTPv2 (IEEE 1588)'], ['HISLIP', 'HiSLIP (LXI)']
	]],
	[ _('IoT & Smart Home'), _('Internet of Things and smart home protocols.'), [
		['COAP', 'CoAP'], ['MATTER', 'Matter (Smart Home)'],
		['TIVOCONNECT', 'TiVo Connect'], ['TPLINK_SHP', 'TP-Link Smart Home'],
		['TUYA_LP', 'Tuya (Smart Home)'], ['MESHTASTIC', 'Meshtastic'],
		['TESLA_SERVICES', 'Tesla Services'], ['NEST_LOG_SINK', 'Google Nest Log'],
		['SONOS', 'Sonos']
	]],
	[ _('Medical Protocols'), _('Healthcare and medical imaging protocols.'), [
		['DICOM', 'DICOM'], ['HL7', 'HL7']
	]],
	[ _('Network Equipment Vendors'), _('Vendor-specific management and monitoring traffic.'), [
		['UBIQUITY', 'Ubiquiti'], ['UBNTAC2', 'UBNT AirControl 2'],
		['MIKROTIK', 'MikroTik'], ['MERAKI_CLOUD', 'Meraki Cloud'],
		['NTOP', 'ntop'], ['VMWARE', 'VMware'],
		['HAPROXY', 'HAProxy (PROXY protocol)'], ['KISMET', 'Kismet'],
		['RIPE_ATLAS', 'RIPE Atlas']
	]],
	[ _('Security & Antivirus'), _('Security tools and antivirus traffic.'), [
		['AVAST', 'Avast'], ['CYBERSECURITY', 'Cybersecurity (Generic)'],
		['CRASHLYSTICS', 'Crashlytics'], ['DATASAVER', 'Data Saver'],
		['ROUGHTIME', 'Roughtime'], ['IRIS', 'IRIS']
	]],
	[ _('Proton Suite'), _('Proton privacy-focused services.'), [
		['PROTON', 'Proton (Generic)'], ['PROTON_MAIL', 'Proton Mail'],
		['PROTON_DRIVE', 'Proton Drive'], ['PROTON_CALENDAR', 'Proton Calendar'],
		['PROTON_PASS', 'Proton Pass'], ['PROTON_DOCS', 'Proton Docs'],
		['PROTON_MEET', 'Proton Meet'], ['PROTON_WALLET', 'Proton Wallet'],
		['PROTON_LUMO', 'Proton Lumo']
	]],
	[ _('Yandex Services'), _('Yandex platform services.'), [
		['YANDEX', 'Yandex (Generic)'], ['YANDEX_ALICE', 'Yandex Alice'],
		['YANDEX_DIRECT', 'Yandex Direct'], ['YANDEX_DISK', 'Yandex Disk'],
		['YANDEX_MAIL', 'Yandex Mail'], ['YANDEX_MARKET', 'Yandex Market'],
		['YANDEX_METRIKA', 'Yandex Metrika'], ['YANDEX_MUSIC', 'Yandex Music']
	]],
	[ _('Speed Test & Network Tools'), _('Network speed testing and diagnostic tools.'), [
		['OOKLA', 'Ookla Speedtest'], ['ACCUWEATHER', 'AccuWeather'],
		['EASYWEATHER', 'EasyWeather'], ['EAQ', 'EAQ']
	]],
	[ _('Game Boosters & Accelerators'), _('Game acceleration and network optimization services.'), [
		['GEARUP_BOOSTER', 'GearUP Booster'], ['LAGOFAST', 'LagoFast'],
		['MUDFISH', 'Mudfish']
	]],
	[ _('Miscellaneous Protocols'), _('Other application and transport protocols.'), [
		['CORBA', 'CORBA'], ['FIX', 'FIX (Financial)'],
		['SBE', 'SBE (Simple Binary Encoding)'], ['FLUTE', 'FLUTE/ALC'],
		['KCP', 'KCP'], ['RTPS', 'RTPS (DDS)'], ['RAFT', 'Raft (Consensus)'],
		['RX', 'RX (AFS)'], ['JRMI', 'Java RMI'], ['AJP', 'AJP (Apache JServ)'],
		['JSON', 'JSON'], ['ADOBE_CONNECT', 'Adobe Connect'],
		['CRYNET', 'CryNet (CryEngine)'], ['EGD', 'EGD (Entropy)'],
		['RMCP', 'RMCP (IPMI)'], ['SAP', 'SAP'], ['HCL_NOTES', 'HCL Notes'],
		['OCS', 'OCS Inventory'], ['TRUPHONE', 'Truphone'], ['YOJIMBO', 'Yojimbo'],
		['ZUG', 'ZUG'], ['NVIDIA', 'NVIDIA'], ['1KXUN', '1KXUN'],
		['SD_RTN', 'SD-RTN (Agora)'], ['HPVIRTGRP', 'HP Virtual Group'],
		['NETMOTION', 'NetMotion'], ['UNKNOWN', 'Unknown/Unclassified']
	]]
];

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('ndpi',
			_('Traffic Analysis & Deep Packet Inspection'),
			_('Configure nDPI\'s deep packet inspection engine and enable/disable ' +
			  'individual protocol detection. nDPI 6.0 supports 480+ protocol signatures ' +
			  'including TLS/QUIC fingerprinting, encrypted traffic classification, and ' +
			  'industrial protocol detection.'));

		s = m.section(form.NamedSection, 'dpi', 'analysis',
			_('DPI Engine Settings'));
		s.addremove = false;

		o = s.option(form.Flag, 'tls_fingerprint', _('TLS Fingerprinting (JA3/JA4)'),
			_('Enable TLS client hello fingerprinting to identify applications ' +
			  'by their TLS handshake patterns.'));
		o.default = '1';

		o = s.option(form.Flag, 'quic_detection', _('QUIC Protocol Detection'),
			_('Identify QUIC (HTTP/3) connections and extract SNI from ' +
			  'the initial crypto frame.'));
		o.default = '1';

		o = s.option(form.Flag, 'dns_analysis', _('DNS Traffic Analysis'),
			_('Parse DNS queries and responses to map domain names to IP flows.'));
		o.default = '1';

		o = s.option(form.Flag, 'http_analysis', _('HTTP/HTTPS Header Analysis'),
			_('Inspect HTTP headers and HTTPS SNI to classify web traffic.'));
		o.default = '1';

		o = s.option(form.Flag, 'ssh_fingerprint', _('SSH Fingerprinting (HASSH)'),
			_('Generate HASSH fingerprints from SSH handshakes.'));
		o.default = '1';

		o = s.option(form.Flag, 'ja3_fingerprint', _('JA3 Hash Generation'),
			_('Compute JA3 fingerprint hashes for every TLS client hello.'));
		o.default = '1';

		o = s.option(form.Flag, 'ja4_fingerprint', _('JA4+ Fingerprint Suite'),
			_('Enable JA4+ family of fingerprints (JA4, JA4S, JA4H, JA4L, JA4X).'));
		o.default = '1';

		o = s.option(form.Flag, 'hassh_fingerprint', _('HASSH Fingerprinting'),
			_('Produce HASSH fingerprints from SSH key exchange parameters.'));
		o.default = '1';

		o = s.option(form.Flag, 'detect_encrypted', _('Encrypted Traffic Classification'),
			_('Classify encrypted traffic using packet size and timing analysis.'));
		o.default = '1';

		o = s.option(form.Flag, 'stun_whatsapp', _('STUN/VoIP Call Detection'),
			_('Identify VoIP calls carried over STUN/TURN (WhatsApp, Teams, Zoom).'));
		o.default = '1';

		// Protocol categories — all write into the same UCI section
		PROTOCOL_CATEGORIES.forEach(function(cat) {
			var ps = m.section(form.NamedSection, 'protocols', 'ndpi_protocols',
				cat[0], cat[1]);
			ps.addremove = false;

			cat[2].forEach(function(p) {
				var po = ps.option(form.Flag, 'proto_' + p[0].toLowerCase(), p[1]);
				po.default = '1';
				po.rmempty = false;
			});
		});

		return m.render().then(function(node) {
			// Apply the multi-column layout to every section that
			// contains protocol checkboxes
			requestAnimationFrame(function() {
				node.querySelectorAll('.cbi-section-node').forEach(function(sn) {
					if (sn.querySelector('.cbi-value[id*="proto_"]'))
						sn.classList.add('ndpi-proto-columns');
				});
			});

			return E('div', {}, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpi/css/ndpi.css') }),
				node
			]);
		});
	}
});
