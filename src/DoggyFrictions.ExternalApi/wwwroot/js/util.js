const isRus = navigator?.language?.indexOf('ru') > -1;

String.prototype.formatMoney = function () {
    var number = Number((this.toString() + '').replace(/[\$₽]/g, '').replace(/[,]/g, '.'));
    number = number.toFixed(2);
    return isRus ? `${number}₽` : `$${number}`;
};
Number.prototype.formatMoney = function() {
    var number = this.toFixed(2);
    return isRus ? `${number}₽` : `$${number}`;
};
String.prototype.formatNumber = function () {
    return Number((this.toString() + '').replace(/[\$₽]/g, '').replace(/[,]/g, '.'));
};
Number.prototype.formatNumber = function () {
    return Number((this + '').replace(/[\$₽]/g, '').replace(/[,]/g, '.'));
};