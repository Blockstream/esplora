- @cycle/history had to be patched (via patch-package) to properly handle `<base href>`

- search form submissions were not properly caught by cyclejs's dom driver, had to be
  worked around with a hack using rxjs directly.

