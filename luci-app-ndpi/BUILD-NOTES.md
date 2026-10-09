# luci-app-ndpi build notes

This revision targets OpenWrt 25.12 with APK v3 and uses the standard
`luci.mk` build glue. The frontend is pure client-side JavaScript
(`htdocs/luci-static/resources/view/ndpi/*.js`); all data endpoints are
served by the rpcd backend at `/usr/libexec/rpcd/ndpi` — there is no Lua
controller and no `luci-compat` dependency.

## Build

Copy this directory into the matching OpenWrt 25.12 buildroot or SDK package
tree, select `luci-app-ndpi`, and rebuild it.

After building, verify the APK metadata:

```sh
apk adbdump ./luci-app-ndpi-*.apk | sed -n '/^info:/,/^paths:/p'
```

The metadata must contain `arch: noarch`. It should also list `luci-base`,
`rpcd`, `jshn`, and `libndpi` as dependencies. The package selects
`LIBNDPI_NDPIREADER` so that `/usr/bin/ndpiReader` is built into the
`libndpi` package; feeds that provide a separate `ndpi-tools` package can
substitute that dependency instead.

## Install

```sh
sed -i '/^luci-app-ndpi/d' /etc/apk/world
apk add --allow-untrusted ./luci-app-ndpi-*.apk
/etc/init.d/rpcd restart
/etc/init.d/ndpi enable
/etc/init.d/ndpi restart
```

## Translations

`po/zh_Hans/ndpi.po` provides the Simplified Chinese catalog; `luci.mk`
automatically builds a `luci-i18n-ndpi-zh-cn` sub-package from it.

## Service

The service command was updated for nDPI 6: JSON output uses `-K json -k`,
tunnel dissection uses `-t`, and global engine settings use `--cfg`.
