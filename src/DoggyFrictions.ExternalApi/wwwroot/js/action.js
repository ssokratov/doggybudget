function ActionModel(actionData, sessionModel, isEdit) {
    var _this = this;
    _this.Id = actionData.Id || 0;
    _this.Session = sessionModel;
    _this.Date = ko.observable((actionData.Date || Date()).formatDate());
    
    // Always ensure we have exactly one payer
    var payersData = actionData.Payers || [];
    if (payersData.length === 0) {
        payersData = [{ ParticipantId: sessionModel.Participants[0].Id }];
    }
    _this.PayerId = ko.observable(payersData.ParticipantId);

    // Always ensure we have exactly one consumption
    var consumptionsData = actionData.Consumptions || [];
    if (consumptionsData.length === 0) {
        consumptionsData = [{ Amount: 0 }];
    }
    var consumption = new ConsumptionModel(consumptionsData[0], _this.Session);

    // For new actions, activate all consumers by default
    if (_this.Id === 0 && (!actionData.Consumptions || actionData.Consumptions.length === 0)) {
        _.forEach(consumption.Consumers(), function (consumer) {
            consumer.IsActive(true);
        });
    }

    _this.Consumptions = ko.observableArray([consumption]);

    _this.Description = ko.observable(actionData.Description);
    _this.IsEdit = ko.observable(isEdit || false);

    _this.Amount = ko.computed(function () {
        return _.reduce(_this.Consumptions(), function (current, next) {
            return current + Number(next.Amount());
        }, 0);
    });
    _this.PayerName = ko.computed(function () {
        return _this.Session.GetParticipant(_this.PayerId()).Name()];
    });

    this.ToggleConsumer = function (participant) {
        if (!_this.IsEdit()) {
            return;
        }
        var consumption = _this.Consumptions()[0];
        if (!consumption) {
            return;
        }
        var consumer = _.find(consumption.Consumers() || [], function(consumer) {
            return consumer.ParticipantId == participant.Id;
        });
        if (consumer) {
            consumer.IsActive(!consumer.IsActive());
        }
    }

    this.Save = function() {
        var operation = _this._createSaveOperation();
        window.App.Functions.Process(operation);
        $.when(operation).done(function(actionData) {
            window.App.Functions.Move('#/Session/' + _this.Session.Id)();
        });
    }
    this._createSaveOperation = function() {
        var serialized = {
            Id: _this.Id,
            SessionId: _this.Session.Id,
            Description: _this.Description(),
            Date: _this.Date().extractDate(),
            Payers: [{                
                Id: 0,
                ParticipantId: _this.PayerId(),
                Amount: _this.Consumptions()[0].Amount()
            }],
            Consumptions: {
                Id: _this.Consumptions()[0].Id,
                Amount: _this.Consumptions()[0].Amount(),
                SplittedEqually: true,
                Consumers: _.map(_.filter(_this.Consumptions()[0].Consumers(), function (consumerModel) {
                    return consumerModel.IsActive();
                }), function (consumerModel) {
                    return {
                        Id: consumerModel.Id,
                        ParticipantId: consumerModel.ParticipantId,
                        Amount: consumerModel.Amount()
                    };
                })
            }
        };
        var operation = (_this.Id == 0
            ? $.post('Api/Actions/' + _this.Session.Id, serialized)
            : $.put('Api/Actions/' + _this.Session.Id + '/' + _this.Id, serialized)).promise();
        return operation;
    }

    this.Delete = function() {
        if (_this.Id <= 0) {
            alert('Can\'t delete action with id = ' + _this.Id);
            return;
        }
        var operation = $.ajax({
            url: 'Api/Actions/' + _this.Session.Id + '/' + _this.Id,
            type: 'DELETE'
        }).promise();
        window.App.Functions.Process(operation)
            .done(function() {
                window.App.Functions.Move('#/Session/' + _this.Session.Id)();
            });
    }

    var currentPlace = _this.IsEdit() ? (_this.Id ? 'Правка' : 'Новый чек') : 'Чек';
    var navigation = new NavigationModel(currentPlace);
    navigation.AddHistory('Тёрка', '#/Session/' + _this.Session.Id);
    if (_this.IsEdit() && _this.Id) {
        navigation.AddHistory('Чек', '#/Session/' + _this.Session.Id + '/Action/' + _this.Id);
    }
    this.Navigation = navigation;
}