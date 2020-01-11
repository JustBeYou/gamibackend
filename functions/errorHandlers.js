async function safeResponse(response, action) {
    try {
        await action();
    }
    catch (error) {
        response.status(400).json({status: error.toString()});
    }
}

function requestEmptyData(req, res, next) {
    if (req.body.data === undefined) {
        res.status(400).json({status: 'empty body'});
        return ;
    }
    next();
}

function requestEmptyQuery(req, res, next) {
    if (req.body.data === undefined || req.body.data.query === undefined) {
        res.status(400).json({status: 'empty query'});
        return ;
    }
    next();
}

module.exports = {
    safeResponse,
    requestEmptyData,
    requestEmptyQuery,
};
