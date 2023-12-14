import Mock from 'mockjs';
import { API_URLS } from '../api';

function importMock() {
    if (import.meta.env.ENV == "production") {
        return
    }
    Mock.mock(RegExp(API_URLS.api_files.url + ".*"), API_URLS.api_files.method, (options:any)=>{
        const url = options.url
        // 把url?后面的参数转成键值对
        const params = url.split('?')[1].split('&').reduce((pre:any, cur:any) => {
            const [key, value] = cur.split('=')
            // 由于是url链接里面的字符，对于中文需要做一次转码
            pre[key] = decodeURIComponent(value)
            return pre
        }, {})
        const name = params?.path?.split('/').pop()
        if(params?.path === '所有笔记'){
            return {
                status: 200,
                msg: 'success',
                data: {
                    name: name,
                    path: params?.path,
                    files: [
                        { name: '其他', type: 'folder'},
                        { name: 'Test.ai', type: 'file'},
                        { name: 'Test2.ai', type: 'file'},
                    ]
                }
            }
        }else if(params?.path === '所有笔记/其他'){
            return {
                status: 200,
                msg: 'success',
                data: {
                    name: name,
                    path: params?.path,
                    files: [
                        { name: 'Test.ai', type: 'file'},
                    ]
                }
            }
        }else{
            return {
                status: 200,
                msg: 'success',
                data: {
                    name: name,
                    path: params?.path,
                    files: []
                }
            }
        }
        
    });

    Mock.mock(RegExp(API_URLS.api_aditor_files.url + ".*"), API_URLS.api_aditor_files.method, {
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