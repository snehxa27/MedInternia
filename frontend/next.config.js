/**
 * Next.js configuration to ensure Turbopack uses the frontend folder as root
 * This avoids Next inferring the workspace root when multiple lockfiles exist.
 */
/** @type {import('next').NextConfig} */
const path = require('path');

module.exports = {
  turbopack: {
    // Use absolute path to this frontend folder so Turbopack finds pages/app correctly
    root: __dirname
  }
};
