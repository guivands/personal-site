var BizError = require('../error');
var ERROR_CODES = require('../ERROR_CODES');
var util = require('../util');
var sqlUtil = require('../sql-util');

var pool;
module.exports.setPool = function(p) {
  pool = p;
};

var fullDirectoryTree = function(req, res) {
    function addDirToArray(arr,row) {
      var node = {
        id:row.id,
        name:row.name,
        uniqueName:row.uniqueName,
        children:[]
      };
      arr.push(node);
    }
    function findBeforeAdd(dirTree,row) {
      var index;
      for (index in dirTree) {
        var node = dirTree[index];
        if (node.id == row.parentId) {
          addDirToArray(node.children, row);
        } else {
          findBeforeAdd(node.children, row);
        }
      }
    }
    
    var findAllDir = {
      table:'directory',
      orderBy:'parentId'
    };
    sqlUtil.executeQuery(pool, findAllDir, function(err, rows){
      if(err) {
        if (err.g2Error) {
          return err.sendResponse(req, res);
        }
        return new BizError(err, ERROR_CODES.DIR_SELECT_ALL, 'Erro carregando arvore de diretorios')
          .sendResponse(req, res);
      }
      var dirTree=[];
      var index;
      for(index in rows) {
        var row = rows[index];
        if(row.parentId==null){
          addDirToArray(dirTree,row);
        }else{
          findBeforeAdd(dirTree,row);
        }
      }
      res.setHeader('content-type', 'text/javascript');
      res.send(dirTree);
    });
};

var isValidUniqueName = function(uniqueName, callback) {
  var countUnique = {
    table:'directory',
    fields:'count(*) as numregs',
    where:{'uniqueName':uniqueName}
  };
  sqlUtil.executeQuery(pool, countUnique, function (err, rows){
    if (err) {
      if (err.g2Error) {
        return callback(err);
      }
      return callback(new BizError(err, ERROR_CODES.DIR_NUM_UNIQUE_NAME, 
        'Erro ao buscar conexão do Pool de Conexões'));
    }
    
    if (rows[0].numregs) {
      return callback(new BizError(null, ERROR_CODES.DIR_UNIQUE_NAME_DUPLICATE, 
        'Já existe um registro com o uniqueName fornecido'));
    }
    callback(null);
  });
};

var addTreeNode = function(req, res){
  var errMsg = util.missingParameter([
    {param:req.query.name,message:'Nome deve ser fornecido'},
    {param:req.query.uniqueName,message:'Nome único deve ser fornecido'},
    {param:req.query.locale,message:'Locale deve ser fornecido'}
  ]);
  if (errMsg) {
    res.send(errMsg);
    return;
  }
  isValidUniqueName(req.query.uniqueName, function(err){
    if(err) {
      return err.sendResponse(req, res);
    }
    pool.getConnection(function(err, connection) {
        if(err) {
          return new BizError(err, ERROR_CODES.CONNECTION_ERROR, 
            'Erro ao buscar conexão do Pool de Conexões').sendResponse(req, res);
        }
        connection.query("insert into directory (name,uniqueName,parentId,locale) values (?,?,?,?)",
          [req.query.name,req.query.uniqueName,(req.query.parentId?req.query.parentId:null),req.query.locale],
          function(err){
            if(err) {
              return new BizError(err, ERROR_CODES.DIR_INSERT_QUERY, 
                'Erro ao incluir diretório').sendResponse(req, res);
            }
            fullDirectoryTree(req, res);
          }
        );
    });
  });
  
};

module.exports.fullDirectoryTree = fullDirectoryTree;
module.exports.addTreeNode = addTreeNode;