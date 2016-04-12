import express from "express";
import glob from "glob";
import favicon from "serve-favicon";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import compress from "compression";
import methodOverride from "method-override";
import expressHandlebars from "express-handlebars";
import Intl from "intl";
global.Intl = Intl;
import HandlebarsIntl from "handlebars-intl";

export default function (app, config) {
  const exphbs = expressHandlebars.create({
    layoutsDir: config.root + '/app/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [config.root + '/app/views/partials/']
  });
  const env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  HandlebarsIntl.registerWith(exphbs.handlebars);
  app.engine('handlebars', exphbs.engine);
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'handlebars');

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  const controllers = glob.sync(config.root + '/app/controllers/*.js');
  controllers.forEach(controller => {
    require(controller)['default'](app);
    // This means "for each controller file, load that file using require, then
    // call the default function that's exported, with app as a parameter.
    // Those default functions just say 'hey app, use these routes.'"
  });

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
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {},
      title: 'error'
    });
  });
};

