/**
 * CharityAI Test Data
 * All test data sourced from environment variables.
 * No hardcoded credentials.
 */
const config = require('../config/selenium.config');

const testData = {
  donor: {
    email: config.TEST_DONOR_EMAIL,
    password: config.TEST_DONOR_PASSWORD,
    name: 'Test Donor',
  },
  ngo: {
    email: config.TEST_NGO_EMAIL,
    password: config.TEST_NGO_PASSWORD,
    name: 'Test NGO',
  },
  // Non-credential test data
  invalidEmail: 'not-an-email',
  malformedEmail: 'test@',
  emptyString: '',
  longString: 'a'.repeat(300),
  specialChars: '<script>alert(1)</script>',
  sqlInjection: "' OR '1'='1",
  newRegistration: {
    firstName: 'QATest',
    lastName: 'User',
    email: `qatest_${Date.now()}@testdomain.invalid`,
    password: 'TestPass@2024!',
    role: 'donor',
  },
  donation: {
    title: 'QA Test Donation',
    description: 'This is a QA test donation item',
    category: 'food',
    quantity: '5',
    location: 'Test City',
  },
  searchTerms: ['food', 'clothes', 'medicine', 'books', ''],
};

module.exports = testData;
