/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/ConductorTelemetryDecorator"],
    function (ConductorTelemetryDecorator) {
        "use strict";

        describe("ConductorTelemetryDecorator", function () {
            var mockTelemetryService,
                mockConductorService,
                mockConductor,
                mockPromise,
                mockSeries,
                decorator;

            function seriesIsInWindow(series) {
                var i, v, inWindow = true;
                for (i = 0; i < series.getPointCount(); i += 1) {
                    v = series.getDomainValue(i);
                    inWindow = inWindow && (v >= mockConductor.displayStart());
                    inWindow = inWindow && (v <= mockConductor.displayEnd());
                }
                return inWindow;
            }

            beforeEach(function () {
                mockTelemetryService = jasmine.createSpyObj(
                    'telemetryService',
                    [ 'requestTelemetry', 'subscribe' ]
                );
                mockConductorService = jasmine.createSpyObj(
                    'conductorService',
                    ['getConductor']
                );
                mockConductor = jasmine.createSpyObj(
                    'conductor',
                    [ 'queryStart', 'queryEnd', 'displayStart', 'displayEnd' ]
                );
                mockPromise = jasmine.createSpyObj(
                    'promise',
                    ['then']
                );
                mockSeries = jasmine.createSpyObj(
                    'series',
                    [ 'getPointCount', 'getDomainValue', 'getRangeValue' ]
                );

                mockTelemetryService.requestTelemetry.andReturn(mockPromise);
                mockConductorService.getConductor.andReturn(mockConductor);

                // Prepare test series; make sure it has a broad range of
                // domain values, with at least some in the query-able range
                mockSeries.getPointCount.andReturn(1000);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    var j = i - 500;
                    return j * j * j;
                });

                mockConductor.queryStart.andReturn(-12321);
                mockConductor.queryEnd.andReturn(-12321);
                mockConductor.displayStart.andReturn(42);
                mockConductor.displayEnd.andReturn(1977);

                decorator = new ConductorTelemetryDecorator(
                    mockConductorService,
                    mockTelemetryService
                );
            });

            it("adds display start/end times to historical requests", function () {
                decorator.requestTelemetry([{ someKey: "some value" }]);
                expect(mockTelemetryService.requestTelemetry)
                    .toHaveBeenCalledWith([{
                        someKey: "some value",
                        start: mockConductor.displayStart(),
                        end: mockConductor.displayEnd()
                    }]);
            });

            it("adds display start/end times to subscription requests", function () {
                var mockCallback = jasmine.createSpy('callback');
                decorator.subscribe(mockCallback, [{ someKey: "some value" }]);
                expect(mockTelemetryService.subscribe)
                    .toHaveBeenCalledWith(jasmine.any(Function), [{
                        someKey: "some value",
                        start: mockConductor.displayStart(),
                        end: mockConductor.displayEnd()
                    }]);
            });


        });
    }
);
