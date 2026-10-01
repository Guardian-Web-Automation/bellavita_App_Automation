/**
 * Test data — central place for accounts, products, coupons used by specs.
 * Keep secrets in .env; reference them here, don't hard-code.
 */
export const testUsers = {
  primary: {
    email: process.env.TEST_USER_EMAIL || ''
    // add more fields as flows need them
  }
}

export const testProducts = {
  // e.g. a known in-stock SKU / search term for the golden path
  goldenPathSearchTerm: '' // TODO
}

export const coupons = {
  // seed via api-setup; reference codes here
}
