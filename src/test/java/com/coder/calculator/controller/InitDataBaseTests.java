package com.coder.calculator.controller;

import com.coder.calculator.dao.userDao;
import com.coder.calculator.model.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import java.util.Random;

@RunWith(SpringRunner.class)
@SpringBootTest
public class InitDataBaseTests {

	@Autowired
	private userDao userDAO;
	@Test
	public void contextLoads() {
		Random random = new Random();
		for (int i = 0; i < 11; ++i) {
			User user = new User();
			user.setUserame(String.format("USER%d", i));
			user.setPassword("123456");
			userDAO.addUser(user);
		}
	}

}
