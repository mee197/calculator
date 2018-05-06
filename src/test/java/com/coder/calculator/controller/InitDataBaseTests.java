package com.coder.calculator.controller;

import com.coder.calculator.CalculatorApplication;
import com.coder.calculator.dao.userDao;
import com.coder.calculator.model.User;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import java.util.Random;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = CalculatorApplication.class)
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
