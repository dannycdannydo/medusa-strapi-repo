'use strict';

/**
 * website-maintenance-mode service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::website-maintenance-mode.website-maintenance-mode');
