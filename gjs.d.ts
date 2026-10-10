// Minimal declarations for modules supplied by the GNOME JavaScript runtime
// (GJS), rather than by Bun or Node.js.
declare module "gi://Gio" {
  const Gio: any;
  export default Gio;
}

declare module "gi://GLib" {
  const GLib: any;
  export default GLib;
}

declare module "system" {
  const System: {
    exit(status?: number): never;
  };
  export default System;
}
