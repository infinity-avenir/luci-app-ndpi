# SPDX-License-Identifier: GPL-2.0-or-later
#
# LuCI web interface for nDPI Deep Packet Inspection

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-ndpi
PKG_VERSION:=1.0.0
PKG_RELEASE:=3
PKG_MAINTAINER:=Spark Secure <alan@spark-secure.com>
PKG_LICENSE:=GPL-2.0-or-later

LUCI_TITLE:=LuCI interface for nDPI DPI Firewall
LUCI_DESCRIPTION:=\
  Web-based management interface for nDPI deep packet inspection, \
  featuring real-time traffic analysis, protocol detection, flow monitoring, \
  and firewall rule management via an ntopng-like dashboard.
LUCI_DEPENDS:=+luci-base +rpcd +jshn +libndpi
LUCI_PKGARCH:=all

define Package/luci-app-ndpi/config
	select LIBNDPI_NDPIREADER
endef

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-ndpi/conffiles
/etc/config/ndpi
endef

# call BuildPackage - OpenWrt buildroot signature
