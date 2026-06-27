package com.loopbook.be_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BeApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(BeApiApplication.class, args);
	}

}
