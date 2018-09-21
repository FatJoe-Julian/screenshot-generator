const wc = require("webpage-capture"), //good solution, no file touch. Large size though.
  AWS = require("aws-sdk"),
  fs = require("fs"),
  s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  });

function generate_screenshot(url) {
  wc(
    url,
    {
      outputDir: "./tmp"
    },
    (err, res) => {
      if (err) console.log(err);
      if (res) console.log(res);

      fs.readFile(res[0], function(err, data) {
        s3.upload(
          {
            Bucket: "ci-app-assets",
            Key:
              "site_screenshots/" +
              url.replace(/\W/g, "").replace("httpwww", "") +
              ".png",
            Body: data
          },
          function(err, data) {
            if (err) {
              console.log(err);
              return {
                state: "failure",
                message: err
              };
            } else {
              console.log(data);
              fs.unlink(res[0], function(err) {
                if (err) {
                  console.error(err);
                }
                console.log("Temp File " + res[0] + " Deleted");
              });

              return {
                state: "success",
                URL: data.Location
              };
            }
          }
        );
      });
    }
  );
}

exports.handler = (event, context) => {
  generate_screenshot(event.data.url);
};

generate_screenshot(event.data.url); //TODO remove this in production. Its here for testing.
