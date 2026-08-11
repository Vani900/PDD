/**
 * CharityAI Appium Test Data
 */
const config = require('../config/appium.config');
module.exports = {
  donor: { email: config.TEST_DONOR_EMAIL, password: config.TEST_DONOR_PASSWORD },
  ngo: { email: config.TEST_NGO_EMAIL, password: config.TEST_NGO_PASSWORD },
  invalidEmail: 'notanemail',
  wrongPassword: 'WrongPassword999!',
  longString: 'A'.repeat(300),
  specialChars: '<script>alert(1)</script>',
  sqlInjection: "' OR '1'='1",
  newUser: {
    firstName: 'QAAppium',
    lastName: 'Test',
    email: `qa_appium_${Date.now()}@testdomain.invalid`,
    password: 'TestPass@2024!',
  },
};
