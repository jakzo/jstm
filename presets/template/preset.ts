// This file will be replaced when building preset packages so it doesn't
// really matter which preset is exported when it comes to building packages,
// but we export the node preset from the template so that this repo can use
// the template as its JSTM preset package instead of building the packages
// first.
export { default } from "../node";
