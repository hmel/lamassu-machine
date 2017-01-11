var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _BillValidator = require('node-ssp');
var assert = require("assert");

function BillValidator() {

    EventEmitter.call(this);
    var self = this;

    const POLLING = 0;
    const ESCROW = 1;
    
    this.state = POLLING;

    this.validator = new _BillValidator();
    this.channel_values = [];

    this.lowestBill = function() {
        if (self.channel_values[0]) {
            var res = self.channel_values[0].long_value;
            console.log('lowestBill %s', res);
            return res;
        }
        return null;
    }
    
    this.highestBill = function() {
        if (self.channel_values[self.channel_values.length -1]) {
            var res = self.channel_values[self.channel_values.length -1].long_value;
            console.log('highestBill %s', res);
            return res;
        }
        return null;
    }

    this._setup_events = function() {

        //billValidator.on('disconnected', function () { self._billValidatorErr() })

        //billValidator.on('billAccepted', function () { self._billInserted() })
        self.validator.on("billAccepted", function(channel) {
            console.log("Note credited");
            self.emit("billValid");
        });


        self.validator.on("scanning", function() {
            self.emit("billAccepted");
        });

        self.validator.on("escrow", function(channel) {
            debugger;
            assert(channel > 0, "Channel should be > 0");
            console.log("Note in channel %s", channel);
            self.state = ESCROW;
            self.emit("billRead", {denomination: self.channel_values[channel-1].long_value});
        });
        
        //billValidator.on('billRead', function (data) { self._billRead(data) })
        //billValidator.on('billValid', function () { self._billValid() })
        //billValidator.on('billRejected', function () { self._billRejected() })
        //billValidator.on('timeout', function () { self._billTimeout() })
        //billValidator.on('standby', function () { self._billStandby() })
        //billValidator.on('jam', function () { self._billJam() })
        //billValidator.on('stackerOpen', function () { self._stackerOpen() })
        //billValidator.on('enabled', function (data) { self._billsEnabled(data) })

        self.validator.on("error", function() {
            self.emit("error");
        });

        self.validator.on("disabled", function() {
            self.emit("disabled");
        });

        //self.validator.on("escrow", self.escrow);
        //self.validator.on("disabled", self.disabled);
    }
        

    this.run = function(cb) {
        console.log('run');
        self.validator.init(function () {
            console.log("Validator::Init");
            self.validator.sync(function() {
                console.log("Validator::Sync");
                self.validator.set_protocol_version(7, function(res) {
                    self.validator.setup_encryption(function() {
                        console.log("Validator::SetupEncryption");
                        self.validator.set_inhibits(function() {
                            console.log("Validator::SetInhibits");
                            self.validator.get_channel_value(function(res) {
                                debugger;
                                console.log("Channel Values");
                                console.log(res);
                                self.channel_values = res;
                            });
                            console.log("Setting up events");
                            self._setup_events();
                            setInterval(self.poll, 100);
                            cb();
                        });
                    });
                });
            });
        });
    }

    this.poll = function() {
        //if bill in escrow, send hold so we don't accept it before brain says so
        if (self.state === ESCROW) {
            self.validator.hold(function() {
                console.log("Holding...");
            });
        } else {
            console.log("Polling...");
            self.validator.poll(function(res) {
            });
        }
    }

    this.close = function(cb) {
        console.log('close');
    }
    
    this.lightOff = function() {
        console.log('lightOff');
        self.validator.display(false, function () {
            console.log("Validator::lightOff");
        });
    }
    
    this.lightOn = function() {
        console.log('lightOn');
        self.validator.display(true, function () {
            console.log("Validator::lightOn");
        });
    }
    
    this.disable = function() {
        console.log('disable');
        self.validator.disable(function() {
            console.log("BillValidator::disabled");
        });
    }

    this.enable = function() {
        console.log('enable');
        self.validator.set_inhibits(function() {
            self.validator.enable(function() {
                self.validator.display(true, function() {
                    console.log("BillValidator::enabled");
                    self.emit("enabled");
                });
            });
        });
    }

    this.hasDenominations = function() {
        debugger;
        console.log('hasDenominations');
        return true;
    }

    this.reject = function() {
        console.log('reject');
    }

    this.stack = function() {
        console.log('stack');
        self.state = POLLING;
        //will accept bill on next poll
    }
};

util.inherits(BillValidator, EventEmitter);
module.exports = BillValidator;
