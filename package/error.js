var BizError = function(err,cd,msg) {
    this.error = err;
    this.code = cd;
    this.message = msg;
    this.g2Error = true;
    console.error(this);
};

BizError.prototype.sendResponse = function(req, res) {
    if (req.xhr) {
        res.status(this.error ? 500 : 200).send(this);
    } else {
        res.status(500).render('error');
    }
};

BizError.notFound = function(req, res) {
    res.status(404).render('404');
};

BizError.success = function(req, res) {
    res.status(200).send({success:true});
};

module.exports = BizError;