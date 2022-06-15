const {ObjectId} = require('mongodb');
module.exports = function (req, res, next){
  if(!req.body) {
    res.send("No body found in reqest...");
    return;
  }
  if(!req.body._id){
    res.json(
      {
        error: 'missing _id',
      }
    );
    return;
  } 
  req.body.rawId = req.body._id;
  try{
    req.body._id = new ObjectId(req.body._id);
    const payload = {...req.body};
    delete payload._id;
    delete payload.rawId;
    req.body.payload = payload;
    req.isValid = true;
  } catch {
    req.isValid = false;
  }
  next();
}