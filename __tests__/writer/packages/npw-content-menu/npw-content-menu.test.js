import Helper from '../../../helpers'
import Api from '../../../../writer/api/Api'
import sinon from 'sinon'
import {Tool, Command} from 'substance'

describe('Add text style and tools to the configurator', () => {

    let xhr, requests, App, app, api

    beforeEach(() => {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        };

    })

    afterEach(() => {
        document.body.innerHTML = '<div></div>';
        app = null
        App = null
        xhr.restore();
    })

    it('Can add a Content menu tool through the NPWriterConfigurator', () => {

        class TestCommand extends Command {
            getCommandState() {
                return {
                    disabled: false,
                    active: false
                }
            }
        }
        class TestTool extends Tool {

            getCommandState() {
                return {
                    disabled: false,
                    active: false,
                    mode: null
                }
            }

        }

        let configurator = Helper.getConfigurator()

        // Add tool and command
        configurator.addCommand('testTool', TestCommand)
        configurator.addContentMenuTool('testTool', TestTool)

        // Check if tool is added and belongs to correct Tool group
        let testTool = configurator.config.toolGroups.get('content-menu').tools.get('testTool')
        expect(testTool.options.toolGroup).toBe('content-menu')

        // Check if commands is added
        expect(configurator.config.commands['testTool'].name).toBe('testTool')

    })

})