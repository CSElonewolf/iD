import * as d3 from 'd3';
import { t, textDirection } from '../../util/locale';
import { modeBrowse, modeSelect } from '../../modes';
import { utilRebind } from '../../util/rebind';
import { icon, pointBox, transitionTime } from './helper';


export function uiIntroNavigation(context, reveal) {
    var dispatch = d3.dispatch('done'),
        timeouts = [],
        hallId = 'n2061',
        townHall = [-85.63591, 41.94285],
        townHallPreset = context.presets().item('amenity/townhall'),
        springStreetId = 'w397',
        springStreetEndId = 'n1834',
        springStreet = [-85.63582, 41.94255];


    var chapter = {
        title: 'intro.navigation.title'
    };


    function timeout(f, t) {
        timeouts.push(window.setTimeout(f, t));
    }


    function eventCancel() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }


    function isTownHallSelected() {
        var ids = context.selectedIDs();
        return ids.length === 1 && ids[0] === hallId;
    }


    function trimmedMap() {
        var rect = d3.select('#map').node().getBoundingClientRect();
        return {
            left: rect.left + (textDirection === 'rtl' ? 60 : 10),
            top: rect.top + 70,
            width: rect.width - 60,
            height: rect.height - 170
        };
    }


    function dragMap() {
        context.history().reset('initial');

        var msec = transitionTime(townHall, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(townHall, msec);

        timeout(function() {
            var centerStart = context.map().center();

            reveal(trimmedMap(), t('intro.navigation.drag'));
            context.map().on('drawn.intro', function() {
                reveal(trimmedMap(), t('intro.navigation.drag'), { duration: 0 });
            });

            context.map().on('move.intro', function() {
                var centerNow = context.map().center();
                if (centerStart[0] !== centerNow[0] || centerStart[1] !== centerNow[1]) {
                    context.map().on('move.intro', null);
                    timeout(function() { continueTo(zoomMap); }, 1500);
                }
            });

        }, msec + 100);

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function zoomMap() {
        var zoomStart = context.map().zoom();

        reveal(trimmedMap(), t('intro.navigation.zoom'));
        context.map().on('drawn.intro', function() {
            reveal(trimmedMap(), t('intro.navigation.zoom'), { duration: 0 });
        });

        context.map().on('move.intro', function() {
            if (context.map().zoom() !== zoomStart) {
                context.map().on('move.intro', null);
                timeout(function() { continueTo(features); }, 1500);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            nextStep();
        }
    }


    function features() {
        var onClick = function() { continueTo(clickTownHall); };

        reveal(trimmedMap(), t('intro.navigation.features'),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('drawn.intro', function() {
            reveal(trimmedMap(), t('intro.navigation.features'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: onClick }
            );
        });

        function continueTo(nextStep) {
            context.map().on('drawn.intro', null);
            nextStep();
        }
    }


    function clickTownHall() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');

        reveal(null, null, { duration: 0 });
        context.map().zoomEase(19, 500);

        timeout(function() {
            var entity = context.hasEntity(hallId);
            if (!entity) return;
            context.map().centerEase(entity.loc, 500);

            timeout(function() {
                var entity = context.hasEntity(hallId);
                if (!entity) return;
                var box = pointBox(entity.loc, context);
                reveal(box, t('intro.navigation.click_townhall'));

                context.map().on('move.intro drawn.intro', function() {
                    var entity = context.hasEntity(hallId);
                    if (!entity) return;
                    var box = pointBox(entity.loc, context);
                    reveal(box, t('intro.navigation.click_townhall'), { duration: 0 });
                });

                context.on('enter.intro', function() {
                    if (isTownHallSelected()) continueTo(selectedTownHall);
                });

            }, 550);  // after centerEase

        }, 550); // after zoomEase

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.on('enter.intro', null);
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function selectedTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        var entity = context.hasEntity(hallId);
        if (!entity) return clickTownHall();

        var box = pointBox(entity.loc, context);
        var onClick = function() { continueTo(editorTownHall); };

        reveal(box, t('intro.navigation.selected_townhall'),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('move.intro drawn.intro', function() {
            var entity = context.hasEntity(hallId);
            if (!entity) return;
            var box = pointBox(entity.loc, context);
            reveal(box, t('intro.navigation.selected_townhall'),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: onClick }
            );
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function editorTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        var onClick = function() { continueTo(presetTownHall); };

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        reveal('.entity-editor-pane',
            t('intro.navigation.editor_townhall'),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function presetTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        var onClick = function() { continueTo(fieldsTownHall); };

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        reveal('.inspector-body .preset-list-item.inspector-inner',
            t('intro.navigation.preset_townhall', { preset: townHallPreset.name() }),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function fieldsTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        var onClick = function() { continueTo(closeTownHall); };

        context.on('exit.intro', function() {
            continueTo(clickTownHall);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        reveal('.inspector-body .inspector-preset',
            t('intro.navigation.fields_townhall'),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function closeTownHall() {
        if (!isTownHallSelected()) return clickTownHall();

        context.on('exit.intro', function() {
            continueTo(searchStreet);
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(hallId)) {
                continueTo(clickTownHall);
            }
        });

        var selector = '.entity-editor-pane button.preset-close svg use';
        var href = d3.select(selector).attr('href') || '#icon-close';

        reveal('.entity-editor-pane',
            t('intro.navigation.close_townhall', { button: icon(href, 'pre-text') })
        );

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function searchStreet() {
        context.enter(modeBrowse(context));
        context.history().reset('initial');  // ensure spring street exists

        var msec = transitionTime(springStreet, context.map().center());
        if (msec) { reveal(null, null, { duration: 0 }); }
        context.map().zoom(19).centerEase(springStreet, msec);  // ..and user can see it

        timeout(function() {
            reveal('.search-header input',
                t('intro.navigation.search_street', { name: t('intro.graph.name.spring-street') })
            );

            d3.select('.search-header input')
                .on('keyup.intro', checkSearchResult);
        }, msec + 100);
    }


    function checkSearchResult() {
        var first = d3.select('.feature-list-item:nth-child(0n+2)'),  // skip "No Results" item
            firstName = first.select('.entity-name'),
            name = t('intro.graph.name.spring-street');

        if (!firstName.empty() && firstName.text() === name) {
            reveal(first.node(),
                t('intro.navigation.choose_street', { name: name }),
                { duration: 300 }
            );

            context.on('exit.intro', function() {
                continueTo(selectedStreet);
            });

            d3.select('.search-header input')
                .on('keydown.intro', eventCancel, true)
                .on('keyup.intro', null);
        }

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            d3.select('.search-header input')
                .on('keydown.intro', null)
                .on('keyup.intro', null);
            nextStep();
        }
    }


    function selectedStreet() {
        if (!context.hasEntity(springStreetEndId) || !context.hasEntity(springStreetId)) {
            return searchStreet();
        }

        var onClick = function() { continueTo(editorStreet); };
        var entity = context.entity(springStreetEndId);
        var box = pointBox(entity.loc, context);
        box.height = 500;

        reveal(box,
            t('intro.navigation.selected_street', { name: t('intro.graph.name.spring-street') }),
            { buttonText: t('intro.ok'), buttonCallback: onClick }
        );

        context.map().on('move.intro drawn.intro', function() {
            var entity = context.hasEntity(springStreetEndId);
            if (!entity) return;
            var box = pointBox(entity.loc, context);
            box.height = 500;
            reveal(box,
                t('intro.navigation.selected_street', { name: t('intro.graph.name.spring-street') }),
                { duration: 0, buttonText: t('intro.ok'), buttonCallback: onClick }
            );
        });

        context.on('enter.intro', function(mode) {
            if (mode.id !== 'select') {
                // keep Spring Street selected..
                context.enter(modeSelect(context, [springStreetId]));
            }
        });

        context.history().on('change.intro', function() {
            if (!context.hasEntity(springStreetEndId) || !context.hasEntity(springStreetId)) {
                timeout(function() {
                    continueTo(searchStreet);
                }, 300);  // after any transition (e.g. if user deleted intersection)
            }
        });

        function continueTo(nextStep) {
            context.map().on('move.intro drawn.intro', null);
            context.on('enter.intro', null);
            context.history().on('change.intro', null);
            nextStep();
        }
    }


    function editorStreet() {
        var selector = '.entity-editor-pane button.preset-close svg use';
        var href = d3.select(selector).attr('href') || '#icon-close';

        reveal('.entity-editor-pane',
            t('intro.navigation.editor_street', { button: icon(href, 'pre-text') })
        );

        context.on('exit.intro', function() {
            continueTo(play);
        });

        function continueTo(nextStep) {
            context.on('exit.intro', null);
            nextStep();
        }
    }


    function play() {
        reveal('.intro-nav-wrap .chapter-point',
            t('intro.navigation.play', { next: t('intro.points.title') }), {
                buttonText: t('intro.ok'),
                buttonCallback: function() {
                    dispatch.call('done');
                    reveal('#id-container');
                }
            }
        );
    }


    chapter.enter = function() {
        dragMap();
    };


    chapter.exit = function() {
        timeouts.forEach(window.clearTimeout);
        d3.select(window).on('mouseup.intro', null, true);
        context.map().on('move.intro drawn.intro', null);
        context.on('enter.intro', null);
        context.on('exit.intro', null);
        d3.select('.search-header input')
            .on('keydown.intro', null)
            .on('keyup.intro', null);
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
