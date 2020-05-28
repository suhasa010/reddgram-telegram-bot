const express = require('express');
const Log = require('../models/Log');
const router = express.Router();

router.get('/log', async(req, res) => {
  const logs = await Log.find({});
  return res.json({ logs });
})

module.exports = router;