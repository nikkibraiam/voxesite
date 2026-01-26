package com.voxesite.dependencies

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory


object NetworkModule {


    private const val BASE_URL = "http://192.168.2.18:8000/"

    //Esto solo se usa para conexiones API
    fun provideApiService(): ApiService {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}