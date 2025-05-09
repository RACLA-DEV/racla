import { ApiResponse } from '@src/types/dto/common/ApiResponse'
import type { ProxyRequest } from '@src/types/dto/proxy/ProxyRequest'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class ProxyClient {
  private client: AxiosInstance

  constructor(
    baseURL: string = process.env.NODE_ENV === 'development'
      ? 'https://dev.api.racla.app/api'
      : 'https://api.racla.app/api',
  ) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })
  }

  /**
   * 일반 GET 요청을 보냅니다.
   * @param url 요청할 URL
   * @param config Axios 요청 설정
   * @returns axios 응답 객체를 포함한 Promise
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return await this.client.get<ApiResponse<T>>(url, config)
  }

  /**
   * 일반 POST 요청을 보냅니다. 쿠키 정보를 항상 포함합니다.
   * @param url 요청할 URL
   * @param data 요청 바디 데이터
   * @param config Axios 요청 설정
   * @returns axios 응답 객체를 포함한 Promise
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const requestConfig: AxiosRequestConfig = {
      ...config,
      withCredentials: true,
    }
    return await this.client.post<ApiResponse<T>>(url, data, requestConfig)
  }

  /**
   * 프록시 서비스를 통해 GET 요청을 보냅니다.
   * @param url 요청할 URL
   * @param params URL 쿼리 파라미터 (한글 파라미터 지원)
   * @param headers 요청 헤더
   * @returns 응답 데이터를 포함한 Promise
   */
  async getProxy<T>(
    url: string,
    params: Record<string, any> = {},
    headers: Record<string, string> = {},
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const request: ProxyRequest = {
      url,
      method: 'GET',
      type: 'query',
      data: params,
      headers,
    }

    return await this.client.post<ApiResponse<T>>('/v3/racla/proxy', request)
  }

  /**
   * 프록시 서비스를 통해 POST 요청을 보냅니다.
   * @param url 요청할 URL
   * @param data 요청 바디 데이터
   * @param headers 요청 헤더
   * @returns 응답 데이터를 포함한 Promise
   */
  async postProxy<T>(
    url: string,
    data: Record<string, any> = {},
    headers: Record<string, string> = {},
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const request: ProxyRequest = {
      url,
      method: 'POST',
      type: 'body',
      data,
      headers,
    }

    return await this.client.post<ApiResponse<T>>('/v3/racla/proxy', request)
  }
}

// 싱글턴 인스턴스 생성
const proxyClient = new ProxyClient()
export default proxyClient
