package main

import (
        "flag"
        "fmt"
        "log"
        "net/http"
        "net/http/httputil"
        "net/url"
)


func logRequest(r *http.Request) {
        log.Printf("请求: %s %s %s", r.RemoteAddr, r.Method, r.URL)
        for header, values := range r.Header {
                for _, value := range values {
                        log.Printf("请求头: %s: %s", header, value)
                }
        }
}

func logResponse(resp *http.Response) {
        log.Printf("响应: %s %s %d", resp.Request.Method, resp.Request.URL, resp.StatusCode)
        for header, values := range resp.Header {
                for _, value := range values {
                        log.Printf("响应头: %s: %s", header, value)
                }
        }
}

func main() {
        // 使用 flag 定义命令行参数
        backendURLFlag := flag.String("backend", "", "后端服务的 URL")
        httpProxyFlag := flag.String("proxy", "", "HTTP 代理的 URL")

        // 解析命令行参数
        flag.Parse()

        // 检查后端服务 URL 是否为空
        if *backendURLFlag == "" {
                log.Fatal("请提供后端服务的 URL，使用 -backend 参数")
        }

        // 解析后端服务的 URL
        parsedBackendURL, err := url.Parse(*backendURLFlag)
        if err != nil {
                log.Fatalf("解析后端服务 URL 失败: %v", err)
        }

        // 设置 HTTP 代理
        if *httpProxyFlag != "" {
                parsedProxyURL, err := url.Parse(*httpProxyFlag)
                if err != nil {
                        log.Fatalf("解析 HTTP 代理 URL 失败: %v", err)
                }
                http.DefaultTransport = &http.Transport{
                        Proxy: http.ProxyURL(parsedProxyURL),
                }
        }

        // 创建一个反向代理
        proxy := httputil.NewSingleHostReverseProxy(parsedBackendURL)


        // 在发送请求到后端之前记录日志
        proxy.Director = func(r *http.Request) {
                
                r.URL.Scheme = parsedBackendURL.Scheme
                r.URL.Host = parsedBackendURL.Host
                r.Host = parsedBackendURL.Host
                logRequest(r)
        }


        // 设置反向代理的修改器，以支持将参数传递到后端服务
        proxy.ModifyResponse = func(resp *http.Response) error {
                // 在处理响应之前记录日志
                logResponse(resp)                
                query := resp.Request.URL.Query()
                for key, values := range query {
                        for _, value := range values {
                                resp.Header.Add(key, value)
                        }
                }
                return nil
        }

        // 设置反向代理的 HTTP 处理器
        http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
                proxy.ServeHTTP(w, r)
        })

        // 启动 HTTP 服务器
        port := "8080"
        fmt.Printf("代理服务器正在监听端口 %s ...\n", port)
        log.Fatal(http.ListenAndServe(":"+port, nil))
}