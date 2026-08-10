const test = require("node:test");
const assert = require("node:assert/strict");

const { linkToAddr } = require("../client/src/views/util");

test("links to a different address", () => {
  const addr = "bc1qdifferentaddress";
  const vnode = linkToAddr(addr, "bc1qcurrentaddress");

  assert.equal(vnode.sel, "a");
  assert.equal(vnode.data.props.href, `address/${addr}`);
  assert.equal(vnode.text, addr);
});

test("scrolls to the top for the current address", () => {
  const addr = "bc1qcurrentaddress";
  const vnode = linkToAddr(addr, addr);

  assert.equal(vnode.sel, "button");
  assert.deepEqual(vnode.data.props, {
    className: "current-address-link",
    type: "button",
  });
  assert.deepEqual(vnode.data.dataset, { scrollTop: true });
  assert.equal(vnode.data.attrs["aria-label"], `Scroll to top of address ${addr}`);
  assert.equal(vnode.text, addr);
});
