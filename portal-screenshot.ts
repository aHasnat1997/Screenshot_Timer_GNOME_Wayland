#!/usr/bin/gjs -m
// @ts-nocheck

// TypeScript-compatible source executed by GJS. GJS provides the GNOME
// libraries required for the Wayland desktop portal.
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import System from "system";

const DESTINATION = "org.freedesktop.portal.Desktop";
const PORTAL_PATH = "/org/freedesktop/portal/desktop";
const REQUEST_INTERFACE = "org.freedesktop.portal.Request";
const TIMEOUT_MS = 30_000;

const loop = new GLib.MainLoop(null, false);
const connection = Gio.bus_get_sync(Gio.BusType.SESSION, null);
let requestPath = null;
let completed = false;

function finish(error = null, uri = null) {
  if (completed) return;
  completed = true;
  if (error) {
    printerr(error.message);
    System.exit(1);
  }
  print(uri);
  loop.quit();
}

connection.signal_subscribe(
  DESTINATION,
  REQUEST_INTERFACE,
  "Response",
  null,
  null,
  Gio.DBusSignalFlags.NONE,
  (_connection, _sender, objectPath, _interface, _signal, parameters) => {
    if (objectPath !== requestPath) return;

    const status = parameters.get_child_value(0).get_uint32();
    const results = parameters.get_child_value(1);
    const uri = results.lookup_value("uri", null)?.deepUnpack();
    if (status !== 0 || !uri) {
      finish(new Error("The desktop portal did not grant screenshot permission."));
      return;
    }
    finish(null, uri);
  },
);

connection.call(
  DESTINATION,
  PORTAL_PATH,
  "org.freedesktop.portal.Screenshot",
  "Screenshot",
  new GLib.Variant("(sa{sv})", ["", { interactive: new GLib.Variant("b", false) }]),
  null,
  Gio.DBusCallFlags.NONE,
  -1,
  null,
  (bus, result) => {
    try {
      requestPath = bus.call_finish(result).deepUnpack()[0];
    } catch (error) {
      finish(error);
    }
  },
);

GLib.timeout_add(GLib.PRIORITY_DEFAULT, TIMEOUT_MS, () => {
  finish(new Error("Timed out waiting for the desktop portal response."));
  return GLib.SOURCE_REMOVE;
});

loop.run();
