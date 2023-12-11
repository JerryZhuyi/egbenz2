import Mock from 'mockjs';
import { API_URLS } from '../api';

function importMock() {
    if (import.meta.env.ENV == "production") {
        return
    }
    Mock.mock(API_URLS.api_files.url, API_URLS.api_files.method, {
        status: 200,
        msg: 'success',
        data: {
            files: [
                { name: 'file1', type: 'file', size: 1024 },
                { name: 'file2', type: 'file', size: 1024 },
                { name: 'file3', type: 'file', size: 1024 },
            ]
        }
    });

    Mock.mock(API_URLS.api_aditor_files.url, API_URLS.api_aditor_files.method, {
        status: 200,
        msg: 'success',
        data: {
            doc: {
                "name": "aditor",
                "type": "child",
                "style": {},
                "data": {
                    "version": "0.0.1",
                },
                "children": [
                    {
                        "name": "aditorText",
                        "type": "leaf",
                        "style": {},
                        "data": {
                            "text": "Hello, world!",
                        },
                        "children": []
                    }, {
                        "name": "aditorParagraph",
                        "type": "child",
                        "style": {},
                        "data": {
                            "text": "bad world",
                        },
                        "children": [{
                            "name": "aditorText",
                            "type": "leaf",
                            "style": {},
                            "data": {
                                "text": "bad world",
                            },
                            "children": []
                        }]
                    }
                ]
            }
        }
    });

}

importMock()