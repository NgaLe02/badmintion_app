package com.badmintion.authservice.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class SsoPageController {

    @GetMapping("/sso/login")
    public String loginPage() {
        return "forward:/sso/login.html";
    }

    @GetMapping("/sso/register")
    public String registerPage() {
        return "forward:/sso/register.html";
    }
}
