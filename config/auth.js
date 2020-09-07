module.exports = {
    ensureAuthenticated: function(req,res,next) {
        if(req.isAuthenticated()){
            return next();
        }
        res.render('login',{
            UserError: "Please Log In.",
            Display:"display:block"
        });
    }
}