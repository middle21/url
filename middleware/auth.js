
let jwt = require('jsonwebtoken');
const config = require('../config/config.js');

let checkToken = (req, res, next) => {
  let token = req.headers['access-token'];
  

  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        const user_id = decoded.id;
        req.body.user_id = user_id;
        next();
      }
    });
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

module.exports = {
  checkToken: checkToken
}
