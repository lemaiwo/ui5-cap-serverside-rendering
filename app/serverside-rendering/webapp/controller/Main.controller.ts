import HBox from "sap/m/HBox";
import Page from "sap/m/Page";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Controller from "sap/ui/core/mvc/Controller";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace be.wl.serversiderendering.controller
 */
export default class Main extends Controller {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit() {
        this.getList();
    }
    public async getList() {
        const model = this.getOwnerComponent()?.getModel() as ODataModel;
        // const binding = model.bindContext("/BooksUI(0)/content");
        // const result = await binding.requestObject();
        const response = await fetch(`${model.getServiceUrl()}/BooksUI(0)/content`);
        const result = await response.text()
        const fragment = await Fragment.load({
            type: "XML",
            definition: result
        });
        // put the Fragment content into the document
        (fragment as Control).placeAt((this.byId("listpage") as Page));
    }
}