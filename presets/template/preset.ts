// This file will be replaced when building preset packages so it doesn't
// really matter which preset is exported when it comes to building packages,
// but we export the node preset from the template so that the stub package in
// this repo can use this template folder as its JSTM preset package instead of
// building the packages first.
export { default } from "../node";
