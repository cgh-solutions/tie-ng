/*!
 Tie-ng - http://develman.github.io/tiejs
 Licensed under the MIT license

 Copyright (c) 2014 Christoph Huppertz <huppertz.chr@gmail.com>, Georg Henkel <georg@develman.de>

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

angular.module("tie-ng", ['angular.css.injector'])
    .directive('tiejsForm', ['$compile', 'cssInjector', function ($compile, cssInjector) {
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

                    //init color picker addon, if color field is available
                    var colorPickers = [];
                    if (colorFieldNames.length > 0) {
                        var colorpickerElements = formElem.find(".color");
                        for (i = 0; i < colorFieldNames.length; i++) {
                            var colorpicker = $(colorpickerElements[i]).colorpicker({
                                color: "#" + scope.bindingSource[colorFieldNames[i]]
                            });
                            colorpicker.on('changeColor', function (event) {
                                var code = event.color.toHex();
                                var fieldName = $(event.currentTarget).find("input").attr("name");
                                scope.bindingSource[fieldName] = code.replace("#", "");
                            });
                            colorPickers.push(colorpicker);
                        }
                    }

                    //init date picker addon, if color field is available
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

                    //init date picker addon, if color field is available
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

                    //init WYSIWYG Textarea "summernote" : https://github.com/summernote/summernote  (old:)http://mindmup.github.io/bootstrap-wysiwyg/
                    var editorPickers = [];
                    if (wysiwygFieldNames.length > 0) {
                        var editorPickerElements = formElem.find(".wysiwyg");
                        for (i = 0; i < wysiwygFieldNames.length; i++) {
                            var editorpicker = $(editorPickerElements[i]).summernote({
                                height: 400,
                                onblur: function (event) {
                                    var fieldName = $(event.currentTarget).parent().prev("div.wysiwyg").attr("name");
                                    scope.bindingSource[fieldName] = $(this).code();
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

                    //init TAG input field https://github.com/alxlit/bootstrap-chosen
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

                    function prepareTypeahead(options, settings, query) {
                        if(options.wildcard && query) {
                            settings.url = settings.url.replace(option.wildcard, encodeURIComponent(query));
                        }

                        settings.type = options.type ? options.type : 'GET';
                        settings.contentType = options.contentType;
                        settings.headers = options.headers;

                        if (query) {
                            settings.data = JSON.stringify(query);
                        }

                        return settings;
                    }

                    //init typeahead addon, if typeahead field is available
                    var typeaheads = [];
                    if (typeaheadFieldNames.length > 0) {
                        var typeaheadElements = formElem.find(".typeahead");

                        for (i = 0; i < typeaheadElements.length; i++) {
                            var $elem = $(typeaheadElements[i]);
                            var elemData = $elem.data('elemdata');

                            var bloodhoundOptions = {
                                datumTokenizer: elemData.display ? Bloodhound.tokenizers.obj.whitespace(elemData.display) : Bloodhound.tokenizers.whitespace,
                                queryTokenizer: Bloodhound.tokenizers.whitespace
                            };

                            if(elemData.remote){
                                bloodhoundOptions.remote = elemData.remote;

                                var prep = scope.libraryOptions.typeahead.prepare;
                                if(prep){
                                    bloodhoundOptions.remote.prepare = function(query, settings){
                                        var options = scope.libraryOptions.typeahead.prepare;

                                        if(options.wildcard && query) {
                                            settings.url = settings.url.replace(option.wildcard, encodeURIComponent(query));
                                        }

                                        settings.type = options.type ? options.type : 'GET';
                                        settings.contentType = options.contentType;
                                        settings.headers = options.headers;

                                        if (query) {
                                            settings.data = JSON.stringify(query);
                                        }

                                        return settings;
                                    }
                                }
                            } else if(elemData.prefetch){
                                bloodhoundOptions.prefetch = elemData.prefetch;

                                var prep = scope.libraryOptions.typeahead.prepare;
                                if(prep){
                                    bloodhoundOptions.prefetch.prepare = function(settings){
                                        var options = scope.libraryOptions.typeahead.prepare;

                                        settings.type = options.type ? options.type : 'GET';
                                        settings.contentType = options.contentType;
                                        settings.headers = options.headers;

                                        return settings;
                                    }
                                }
                            } else {
                                bloodhoundOptions.local = elemData.local;
                            }

                            var bloodhound = new Bloodhound(bloodhoundOptions);
                            bloodhound.initialize();


                            var newTypeahead = $elem.typeahead(
                                elemData.options ? elemData.options : null,
                                {
                                    name: $elem.attr("name"),
                                    display: elemData.display ? elemData.display : null,
                                    source: bloodhound,
                                    templates: elemData.templates ? elemData.templates : null
                                });
                            typeaheads.push(newTypeahead);
                        }
                    }

                    // load plugin css styles
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
