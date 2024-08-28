sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/FlexBox",
	"sap/m/Panel",
	"sap/m/Label",
	"sap/m/Text",
	"sap/m/CheckBox",
	"sap/m/Input",
	"sap/m/VBox",
	"sap/m/HBox",
	"sap/m/FlexItemData",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Title",
	"sap/ui/core/format/DateFormat",
	"sap/ui/Device",
	"sap/m/MessageToast"
], function(Controller, FlexBox, Panel, Label, Text, CheckBox, Input, VBox, HBox, FlexItemData, JSONModel, Title, DateFormat, Device,
	MessageToast) {
	"use strict";
	var sUrl = "/sap/opu/odata/SAP/ZCHTCOOKING_SRV/";
	var mark;
	var prod;
	var user;
	return Controller.extend("CHT-Sheet.controller.View1", {
		onInit: function() {

			debugger;

			sap.ui.core.BusyIndicator.show(0);
			this.deviceInfo = Device;
			this.oJSONModel3 = new JSONModel();
			this.oModel3 = new sap.ui.model.odata.ODataModel(sUrl, true);
			user = sap.ushell.Container.getUser().getId();
			debugger;
			this.getProductionOrderData();

		},

		getProductionOrderData: function() {
			this.oJSONModel = new JSONModel();
			this.oModel = new sap.ui.model.odata.ODataModel(sUrl, true);

			this.oModel.read("/HEADSet(Prodorderno='" + user + "')", {
				success: function(data) {
					this.parrallel = data.Prodparallel;
					prod = data.Prodorderno;
					prod = prod.toString().padStart(10, '0');
					var Head = new sap.ui.model.json.JSONModel();
					Head.setData(data);
					this.getView().setModel(Head, "Head");
					this.getProductionOrderItem();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageToast.show("No Production Order for this Vessel");
				}
			});
		},
		getProductionOrderItem: function() {
			this.oJSONModel2 = new JSONModel();
			this.oModel2 = new sap.ui.model.odata.ODataModel(sUrl, true);

			this.oModel2.read("/ItemdataSet", {
				filters: [
					new sap.ui.model.Filter("ProdNo", sap.ui.model.FilterOperator.EQ, prod)
				],
				success: function(data2) {
					debugger;
					this.oJSONModel2.setData({
						testSet2: data2.results
					});
					var serialCounter = 1;
					data2.results.forEach(function(item) {
						item.SerialNumber = serialCounter++;

						if (item.Ins) {
							item.MessageSerialNumber = serialCounter++;
						}
					});
					var Item = new sap.ui.model.json.JSONModel();
					Item.setData(data2);
					this.getView().setModel(Item, "Item");
					this._updateButtonVisibility();
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageToast.show("No Item Data Found");
				}
			});

		},
		_updateButtonVisibility: function() {
			sap.ui.core.BusyIndicator.hide();
		},

		submitBtn: function(oEvent) {
			debugger;

			var oButton = oEvent.getSource();
			var oItem = oButton.getParent().getParent();
			var oContext = oItem.getBindingContext("Item");
			var oData = oContext.getObject();

			if (this.parrallel === "YES") {
				// this._submitLineByLine(oData, oEvent);
				this._submitSingleLine(oData, oEvent);
			} else {
				this._submitSingleLine(oData, oEvent);
			}
		},

		_submitLineByLine: function(oData, oEvent) {
		},

		_submitSingleLine: function(oData, oEvent) {
			var oModel2 = new sap.ui.model.odata.ODataModel(sUrl, true);
			var that = this; // Store the context
			var oDataa = oData;
			oDataa.MessageSerialNumber = "";
			oDataa.SerialNumber = "";
			// });
			oModel2.create("/ItemdataSet", oDataa, {
				success: function(data2) {
					debugger;
					oData.Qcdone = "X";
					var oMainModel = that.getView().getModel("Item"); 

					var oMainModelData = oMainModel.getProperty("/results");
					var oUpdatedEntry = oMainModelData.find(function(item) {
						return item.Item === oData.Item;
					});

					if (oUpdatedEntry) {
						// Update the entry in the main model
						mark = "";
						oUpdatedEntry.Qcdone = "X";
						oMainModel.setProperty("/results", oMainModelData);
						that.onInit();
					}

				},
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageToast.show("Data not saved");
				}

			});

		},
		formatButtonVisibility: function(sProdparallel, sItemParrallel, sQcDone) {
			debugger;

			var oView = this.getView();
			var oItemModel = oView.getModel("Item");
			var aItems = oItemModel.getProperty("/results");

			var bShowButton = false;

			if (sProdparallel === "YES") {
				// Check if QcDone is 'X'
				if (sQcDone === "X") {
					return false;
				} else {
					return true; 
				}
			}

			if (sProdparallel === "NO") {
				if (sQcDone !== "X") {
					for (var i = 0; i < aItems.length; i++) {
						if (aItems[i].Qcdone !== "X") {
							if (mark !== "X") {
								bShowButton = true;
								mark = "X";
							}
						}
					}

				} else {
					mark = "";
				}
			}

			return bShowButton;
		},
		formatDateTime: function(dateTime) {
			if (dateTime) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "dd/MM/YYYY H:mm"
				});
				return oDateFormat.format(new Date(dateTime));
			}
			return dateTime;
		}

	});
});