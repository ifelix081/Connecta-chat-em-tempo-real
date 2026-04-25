const errorHandler = (err, req, res, next) => 
    {
        console.error(err,stack);
        res.status(err,status || 500).json
            ({
                message: err.message || 'Erro interno do servidor', ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
            });
    };

    module.exports = errorHandler;