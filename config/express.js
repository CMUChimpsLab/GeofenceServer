import express from "express";
import glob from "glob";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import compress from "compression";
import expressHandlebars from "express-handlebars";

export default function (app, config) {
  const exphbs = expressHandlebars.create({
    layoutsDir: config.root + '/app/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [config.root + '/app/views/partials/']
  });
  const env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.engine('handlebars', exphbs.engine);
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'handlebars');

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(compress());
  app.use(express.static(config.root + '/public'));

  const controllers = glob.sync(config.root + '/app/controllers/*.js');
  controllers.forEach(controller => {
    require(controller)['default'](app);
    // This means "for each controller file, load that file using require, then
    // call the default function that's exported, with app as a parameter.
    // Those default functions just say 'hey app, use these routes.'"
  });

  // var logFile = fs.createWriteStream('./myLogFile.log', {flags: 'a'}); //use {flags: 'w'} to open in write mode
  // app.use(express.logger({stream: logFile}));

  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {},
      title: 'error'
    });
  });
};
