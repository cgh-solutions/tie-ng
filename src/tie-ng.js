/*!
 Tie-ng - http://develman.github.io/tiejs
 Licensed under the MIT license

 Copyright (c) 2014 Christoph Huppertz <huppertz.chr@gmail.com>, Georg Henkel <georg@develman.de>

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

angular.module("tie-ng", ['angular.css.injector'])
    .directive('tiejsForm', ['$compile', 'cssInjector', '$http', '$sce', function ($compile, cssInjector, $http, $sce) {
        return {
            restrict: 'E',
            scope: {
                "formName": "@formName",
                "showRequiredAsterisk": "@showRequiredAsterisk",    // shows an star on required fields
                "fields": "=fields",                                // fields which should be created in the form
                "bindings": "=bindings",                            // binding option between field-name and variable-name
                "bindingSource": "=bindingSource",                  // object with data
                "onSubmit": "=onSubmit",                            // onsubmit callback function
                "submitButtonId": "@submitButtonId",                // id of submit button (needed if button is outside of the formular)
                "reloadFlag": "=reloadFlag",                        // trigger flag to reload the hole tiejs content
                "libraryOptions": "=libraryOptions"                 // options for the different in tie-ng used libraries. possible option values
                                                                    // typeahead: {
                                                                    //    prepare: {
                                                                    //        type: "POST",
                                                                    //        contentType: "application/json; charset=UTF-8",
                                                                    //        headers: {
                                                                    //            "Authorization": "Bearer " + $auth.getToken()
                                                                    //        }
                                                                    //    }
                                                                    // }
            },
            template: '<form></form>',
            link: function (scope, element, attr) {
                var self = this;

                var addSpecifiedFieldToArray = function (item, array) {
                    scope.bindings.forEach(function (bindingData) {
                        var name = bindingData[item.data.name];
                        if (name)
                            array.push(name);
                    });
                };

                var init = function (scope, element, attr) {
                    var colorFieldNames = [];
                    var dateFieldNames = [];
                    var timeFieldNames = [];
                    var wysiwygFieldNames = [];
                    var tagFieldNames = [];
                    var typeaheadFieldNames = [];

                    // binding parse function
                    // if binding source is an child obj, parse path name and return object
                    // exp: bindingsource.model.child -> return bindingsource.model as parent and child as childname
                    // get value of child: parent[child]
                    var getBindingName = function ($elem, bindings) {
                        var curBinding = null;
                        bindings.forEach(function (binding) {
                            curBinding = binding[$elem.attr("name")];
                            if (curBinding) {
                                return curBinding;
                            }
                        });
                        return curBinding;
                    };

                    var getBindingObj = function (bindingName) {
                        var tmp = "scope.bindingSource";
                        if (bindingName !== "") {
                            tmp += "." + bindingName;
                        }
                        return eval(tmp);
                    };

                    var getParentBindingObj = function (bindingName) {
                        var namespace = "";

                        if (bindingName.indexOf('.') != -1) {
                            var lastPointIdx = bindingName.lastIndexOf('.');
                            namespace = bindingName.substr(0, lastPointIdx);
                            bindingName = bindingName.substr(lastPointIdx + 1);
                        }

                        var tmp = getBindingObj(namespace);
                        return {
                            parentObj: tmp,
                            childName: bindingName
                        }
                    };


                    var checkIfDataHasSpecialField = function (fieldData) {
                        fieldData.forEach(function (item) {
                            switch (item.type) {
                                case "color":
                                    addSpecifiedFieldToArray(item, colorFieldNames);
                                    break;
                                case "date":
                                    addSpecifiedFieldToArray(item, dateFieldNames);
                                    break;
                                case "time":
                                    addSpecifiedFieldToArray(item, timeFieldNames);
                                    break;
                                case "wysiwyg":
                                    addSpecifiedFieldToArray(item, wysiwygFieldNames);
                                    break;
                                case "tags":
                                    addSpecifiedFieldToArray(item, tagFieldNames);
                                    break;
                                case "typeahead":
                                    addSpecifiedFieldToArray(item, typeaheadFieldNames);
                            }
                        });
                    };

                    var options = {
                        "showRequiredAsterisk": scope.showRequiredAsterisk,
                        "formName": scope.formName,
                        "bindingSource": scope.bindingSource,
                        "onSubmit": scope.onSubmit
                    };

                    var formElem = element.find("form");
                    formElem.TieJS(options);
                    var tiejsForm = formElem.data('tiejs');

                    scope.fields.forEach(function (item) {
                        if (item.fieldData) {
                            if (item.fieldType === "field") {
                                tiejsForm.addFields(item.fieldData);
                            } else if (item.fieldType === "column") {
                                tiejsForm.addColumns(item.fieldData);
                            } else {
                                if (console) console.log("tie-ng-directive: unknown type of field (only type -field- and -column- are allowed)");
                            }

                            // if field is color, date or time -> add it to array for init addons
                            checkIfDataHasSpecialField(item.fieldData);
                        }
                    });
                    tiejsForm.addBindings(scope.bindings);


                    var i = 0;

                    // init color picker addon, if color field is available
                    // http://mjolnic.com/bootstrap-colorpicker/
                    // ------------------------------------------------------------------------------------
                    var colorPickers = [];
                    if (colorFieldNames.length > 0) {
                        var colorpickerElements = formElem.find(".color");
                        for (i = 0; i < colorFieldNames.length; i++) {
                            var colorpicker = $(colorpickerElements[i]).colorpicker({
                                color: scope.bindingSource[colorFieldNames[i]],
                                format: "hex"
                            });
                            colorpicker.on('changeColor', function (event) {
                                var code = event.color.toHex();
                                var fieldName = $(event.currentTarget).find("input").attr("name");
                                scope.bindingSource[fieldName] = code;
                            });
                            colorPickers.push(colorpicker);
                        }
                    }

                    // init date picker addon, if date field is available
                    // https://github.com/Eonasdan/bootstrap-datetimepicker
                    // ------------------------------------------------------------------------------------
                    var datePickers = [];
                    if (dateFieldNames.length > 0) {
                        var datepickerElements = formElem.find(".date");
                        for (i = 0; i < dateFieldNames.length; i++) {
                            var datepicker = $(datepickerElements[i]).datetimepicker({
                                locale: 'de',
                                showTodayButton: true
                            });

                            datepicker.on('dp.change', function (event) {
                                var fieldName = $(event.currentTarget).find("input").attr("name");
                                scope.bindingSource[fieldName] = event.date.format("DD.MM.YYYY");
                            });

                            datePickers.push(datepicker);
                        }
                    }

                    //init time picker addon, if time field is available
                    // https://weareoutman.github.io/clockpicker/
                    // ------------------------------------------------------------------------------------
                    var timePickers = [];
                    if (timeFieldNames.length > 0) {
                        var timepickerElements = formElem.find(".time");
                        for (i = 0; i < timeFieldNames.length; i++) {
                            var clockpicker = $(timepickerElements[i]).clockpicker({
                                placement: 'bottom',
                                align: 'left',
                                autoclose: 'true'
                            }).find("input").change(function () {
                                var fieldName = $(this).attr("name");
                                scope.bindingSource[fieldName] = $(this).val();
                            });

                            timePickers.push(clockpicker);
                        }
                    }

                    // init WYSIWYG Textarea "summernote"
                    // https://github.com/summernote/summernote
                    // (old:)http://mindmup.github.io/bootstrap-wysiwyg/
                    // ------------------------------------------------------------------------------------
                    var editorPickers = [];
                    if (wysiwygFieldNames.length > 0) {
                        var editorPickerElements = formElem.find(".wysiwyg");
                        for (i = 0; i < wysiwygFieldNames.length; i++) {
                            var editorpicker = $(editorPickerElements[i]).summernote({
                                height: 400,
                                //onblur: function (event) {
                                //    var bindingName = getBindingName($(this), scope.bindings);
                                //    var obj = getParentBindingObj(bindingName);
                                //    obj.parentObj[obj.childName] = $(this).code();
                                //},
                                onKeyup: function (event) {
                                    var bindingName = getBindingName($(this), scope.bindings);
                                    var obj = getParentBindingObj(bindingName);
                                    obj.parentObj[obj.childName] = $(this).code();
                                },
                                toolbar: [
                                    ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                                    ['font', ['strikethrough']],
                                    ['fontsize', ['fontsize']],
                                    ['color', ['color']],
                                    ['para', ['ul', 'ol', 'paragraph']],
                                    ['height', ['height']],
                                ]
                            });

                            var fieldName = $(editorPickerElements[i]).attr("name");
                            editorpicker.code(scope.bindingSource[fieldName]);

                            editorPickers.push(editorpicker);
                        }
                    }

                    // init TAG input field
                    // https://github.com/alxlit/bootstrap-chosen
                    // ------------------------------------------------------------------------------------
                    var tagFields = [];
                    if (tagFieldNames.length > 0) {
                        var tagElements = formElem.find(".tags");
                        for (i = 0; i < tagFieldNames.length; i++) {
                            var tagField = $(tagElements[i]).chosen({width: "100%"});

                            tagField.change(function (event, changedObj) {
                                var fieldName = $(event.currentTarget).attr("name");
                                var selectedOptions = $(event.currentTarget).find("option:selected");
                                if (changedObj.selected) {
                                    selectedOptions.each(function () {
                                        scope.bindingSource[fieldName].push($(this).val());
                                    });
                                } else {
                                    var idx = scope.bindingSource[fieldName].indexOf(changedObj.deselected);
                                    scope.bindingSource[fieldName].splice(idx, 1);
                                }
                            });

                            tagFields.push(tagField);
                        }
                    }

                    // typeahead input field
                    // https://twitter.github.io/typeahead.js/
                    // ------------------------------------------------------------------------------------
                    function prepareSettings(options, settings, query) {
                        if (options.wildcard && query) {
                            settings.url = settings.url.replace(options.wildcard, encodeURIComponent(query));
                        }

                        settings.type = options.type ? options.type : 'GET';
                        settings.contentType = options.contentType;
                        settings.headers = options.headers;

                        if (query) {
                            settings.data = JSON.stringify(query);
                        }

                        return settings;
                    }


                    // here starts the initialization
                    var typeaheads = [];
                    var bloodhounds = [];
                    if (typeaheadFieldNames.length > 0) {
                        var typeaheadElements = formElem.find(".typeahead");

                        // create bloodhound options object
                        // ---------------------------------
                        function createBloodhoundOptions($elem, elemData) {
                            var bloodhoundOptions = {
                                datumTokenizer: elemData.tokens ?
                                    Bloodhound.tokenizers.obj.whitespace(elemData.tokens) :
                                    Bloodhound.tokenizers.whitespace,
                                queryTokenizer: Bloodhound.tokenizers.whitespace,
                            };

                            //add identify function if minLength == 0 is allowed
                            if (elemData.options.minLength === 0) {
                                bloodhoundOptions.identify = function (obj) {
                                    return obj.id
                                };
                            }

                            // use remote, prefetch oder local data.
                            if (elemData.remote) {
                                bloodhoundOptions.remote = elemData.remote;

                                if (scope.libraryOptions.typeahead.prepare) {
                                    bloodhoundOptions.remote.prepare = function (query, settings) {
                                        var options = scope.libraryOptions.typeahead.prepare;
                                        return prepareSettings(options, settings, query);
                                    }
                                }
                            } else if (elemData.prefetch) {
                                bloodhoundOptions.prefetch = elemData.prefetch;

                                if (scope.libraryOptions.typeahead.prepare) {
                                    bloodhoundOptions.prefetch.prepare = function (settings) {
                                        var options = scope.libraryOptions.typeahead.prepare;
                                        return prepareSettings(options, settings);
                                    }
                                }
                            } else {
                                bloodhoundOptions.local = elemData.local;
                            }

                            return bloodhoundOptions;
                        }

                        // create optional options for typeahead
                        // ---------------------------------
                        function createAdditionalOptions() {
                            var additonalOptions = {
                                name: $elem.attr("name"),
                                source: elemData.options.minLength === 0 ? getSearchValOrAllIfKeyIsNull : bloodhounds[$elem.attr("name")] //bloodhound
                            };
                            if (elemData.limit) {
                                additonalOptions.limit = elemData.limit;
                            }
                            if (elemData.async) {
                                additonalOptions.async = elemData.async;
                            }
                            if (elemData.templateHtml) {
                                additonalOptions.templates = getCustomTemplate(elemData.templateHtml)
                            }
                            if (elemData.display) {
                                additonalOptions.display = getDisplayLayout(elemData.display);
                            }

                            return additonalOptions;
                        }

                        // create the different template views
                        // ---------------------------------
                        function getCustomTemplate(htmlTpl) {
                            var template = {};
                            if (htmlTpl) {
                                if (htmlTpl.empty) {
                                    template.empty = function (data) {
                                        return htmlTpl.empty;
                                    }
                                }

                                if (htmlTpl.pending) {
                                    template.pending = function (data) {
                                        return htmlTpl.pending;
                                    }
                                }

                                if (htmlTpl.suggestion) {
                                    template.suggestion = function (data) {
                                        return eval(htmlTpl.suggestion);
                                    }
                                }

                                if (htmlTpl.header) {
                                    template.header = function (data) {
                                        return eval(htmlTpl.header);
                                    }
                                }

                                if (htmlTpl.footer) {
                                    template.footer = function (data) {
                                        return eval(htmlTpl.footer);
                                    }
                                }
                            }
                            return template;
                        }

                        // format display values
                        // ---------------------------------
                        function getDisplayLayout(display) {
                            return function (obj) {
                                var data = [];
                                var view = display.style;
                                display.items.forEach(function (item) {
                                    data[item] = eval("obj." + item);
                                    view = view.replace(item, data[item]);
                                });

                                return view;
                            }
                        }

                        // get default values if no search key selected and minLength 0 is allowed
                        // ---------------------------------
                        function getSearchValOrAllIfKeyIsNull(q, sync) {
                            var bloodhound = bloodhounds[$(this).attr("name")];
                            if (q === '') {
                                sync(bloodhound.all());
                            } else {
                                bloodhound.search(q, sync);
                            }
                        }


                        // set init value to input field
                        function setValueToTypeaheadInput($elem, elemData) {
                            var bindingName = getBindingName($elem, scope.bindings);
                            var obj = getParentBindingObj(bindingName);
                            var bindingSourceObj = obj.parentObj[obj.childName];
                            var view = "";

                            if (bindingSourceObj && bindingSourceObj.id) { // only if value is avaiable
                                if (elemData.display) {
                                    var data = [];
                                    view = elemData.display.style;
                                    elemData.display.items.forEach(function (item) {
                                        data[item] = bindingSourceObj[item];
                                        view = view.replace(item, data[item]);
                                    });
                                } else {
                                    view = bindingSourceObj[elemData.display];
                                }
                            }

                            newTypeahead.typeahead('val', view);
                        }


                        // create all typeahead objects
                        for (i = 0; i < typeaheadElements.length; i++) {
                            var $elem = $(typeaheadElements[i]);
                            var elemData = $elem.data('elemdata');

                            var bloodhoundOptions = createBloodhoundOptions($elem, elemData);

                            // init the bloodhound engine
                            bloodhounds[$elem.attr("name")] = new Bloodhound(bloodhoundOptions);
                            bloodhounds[$elem.attr("name")].initialize();

                            // check if the thumbprint of the cached data is actual
                            // if (elemData.prefetch && elemData.cache) {
                            //    $http.get(elemData.cache).then(function (response) {
                            //       if (response.data.key != bloodhound.prefetch.thumbprint) {
                            //          bloodhound.prefetch.thumbprint = response.data.key;
                            //
                            //          bloodhound.clearPrefetchCache();
                            //          bloodhound.initialize(true);
                            //      }
                            //});
                            //}


                            // init all configured options
                            var additonalOptions = createAdditionalOptions();

                            // create typeahead element
                            var newTypeahead = $elem.typeahead(
                                elemData.options ? elemData.options : null, additonalOptions);
                            typeaheads.push(newTypeahead);

                            // set inital value from scope with correct format
                            setValueToTypeaheadInput($elem, elemData);

                            // add typeahead event listeners
                            newTypeahead.bind('typeahead:select', function (e, selectedObject) {
                                var bindingName = getBindingName($(this), scope.bindings);
                                var obj = getParentBindingObj(bindingName);
                                obj.parentObj[obj.childName] = selectedObject;
                            });

                            newTypeahead.on('focus', function () {
                                if ($(this).typeahead('val') === '') {
                                    $(this).typeahead('val', '_');
                                    $(this).typeahead('open');
                                    $(this).typeahead('val', '');
                                }
                            });

                            // clear Input field on Broadcast
                            $scope.$on('calendarCtrl.calendar.refetchEvents', function(event, args) {
                                // TODO: load query typeahead element and set value to ""
                            });
                        }
                    }

                    // load plugin css styles
                    // ------------------------------------------------------------------------------------
                    if (cssInjector) {
                        if (colorPickers.length > 0) {
                            cssInjector.add("/public/js/lib/mjolnic-bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css");
                        }
                        if (datePickers.length > 0) {
                            cssInjector.add("/public/js/lib/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css");
                        }
                        if (timePickers.length > 0) {
                            cssInjector.add("/public/js/lib/clockpicker/dist/bootstrap-clockpicker.min.css");
                        }
                        if (tagFields.length > 0) {
                            cssInjector.add("/public/js/lib/chosen/chosen.css");
                        }
                        if (editorPickers.length > 0) {
                            cssInjector.add("/public/js/lib/summernote/dist/summernote.css");
                        }

                    }

                    // trigger submit from outside handler
                    $('#' + scope.submitButtonId).on('click', function () {
                        formElem.trigger('submit');
                    });

                    // add the new created form to angular scope
                    var anguElem = element.find('form');
                    $compile(anguElem.contents())(scope);

                };


                init(scope, element, attr);

                // reload tiejs form listener
                if (scope.reloadFlag) {
                    scope.$watch("reloadFlag", function () {
                        $(element).find('form').children().remove(); //remove old html
                        init(scope, element, attr);
                    });
                }
            }
        };
    }]);
