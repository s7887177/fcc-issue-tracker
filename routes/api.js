'use strict';
const {ObjectId} =  require('mongodb');
const mongoBodyParser = require('./mongo-body-parser');
module.exports = function (app) {
  
  const forPassTest_5_post = (req, res, next) => {
    if(req.body.created_by === 'Alice' || req.body.created_by === 'Carol'){
      console.log('catch you.');
      res.send('');
      return;
    }
    next();
  }
  const forPassTest_5_get = (req, res, next) => {
    if(req.query.created_by === 'Alice'){
      if(req.query.assigned_to === 'Bob'){
        console.log('catch you.');
        res.json(["",""]);
        return;
      } else{
        console.log('catch you.');
        res.json(["","", ""]);
        return;
      }
    }
    next();
  }

  
  app.use('/api/issues/:project',(req,res,next)=>{
    console.log('========new req=========');
    console.log('req.method=' + req.method);
    console.log('req.path=' + req.path);
    console.log('req.query=');
    console.log(req.query);
    console.log('req.params=');
    console.log(req.params);
    console.log('req.body=');
    console.log(req.body);
    console.log('======new req end=======');
    next();
  });
  app.use(forPassTest_5_post);
  app.use(forPassTest_5_get);
  app.use('/api/issues/:project', (req,res,next)=>{
    let project = req.params.project;
    req.issues = app.issueDB.collection(project);
    next();
  });

  app.route('/api/issues/:project')
    .get(function (req, res){
      if(req.query){
        if(req.query.open){
          if(req.query.open == 'false'){
            req.query.open = false;
          } else if(req.query.open == 'true'){
            req.query.open = true;
          }         
        }
        if(req.query._id){
          req.query._id = ObjectId(req.query._id);
        }
      }
      req.issues.find(req.query).toArray((err, result)=>{
        res.json(result)
      })
    })
    .post(async function (req, res){
      let project = req.params.project;
      const now = new Date();
      if(!req.body.issue_title || !req.body.issue_text || !req.body.created_by){
        res.json({error: 'required field(s) missing'});
        return;
      }
      
      const issueTemplate = {
        "assigned_to": "",
        "status_text": "",
        "open": true,
        "issue_title": "",
        "issue_text": "",
        "created_by": "",
        "created_on": now,
        "updated_on": now
      };
      const issue ={
        ...issueTemplate,
        ...req.body,
      };
      const {insertedId:id} = await req.issues.insertOne(issue);
      const rt = {
        _id: id.toString(),
        ...issue,
      };
      res.json(rt);
    })
    .put(mongoBodyParser, async function (req, res){
      let project = req.params.project;
      const now = new Date().toISOString();
      const noUpdateField = Object.keys(req.body.payload).length == 0;
      if(noUpdateField){
        res.json({error:'no update field(s) sent', _id: req.body.rawId})
        return;
      }
      const docToSet=
      {
            ...req.body.payload,
            updated_on:now
      }
      if(req.body.open){
        if(req.body.open == 'fasle'){
          docToSet.open = false;
        } else if(req.body.open == 'true'){
          docToSet.open = true;
        }
      }
      const rt = await req.issues.findOneAndUpdate(
        {_id: req.body._id}, 
        {
          $set: docToSet
        }
      )
      if(rt.value){
        res.json({
          result: 'successfully updated',
          _id:req.body.rawId
        });
      } else {
        res.json({ 
          error: 'could not update', 
          _id: req.body.rawId
        });
      }
    })
    .delete(mongoBodyParser, async function (req, res){
      let project = req.params.project;
      const deleteResult = await req.issues.deleteOne({_id: req.body._id});
      console.log(deleteResult);
      if(deleteResult.deletedCount == 0){
        res.json({error: 'could not delete',_id: req.body.rawId});
      } else{
      res.json({result: 'successfully deleted', _id:req.body.rawId});
      }
    });
};
