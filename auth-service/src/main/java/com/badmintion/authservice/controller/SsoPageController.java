package com.badmintion.authservice.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SsoPageController {

    @Value("${sso.redirect-base}")
    private String redirectBase;

    @GetMapping("/sso/login")
    public String loginPage(Model model) {
        model.addAttribute("redirectBase", redirectBase);
        return "sso/login";
    }

    @GetMapping("/sso/register")
    public String registerPage(Model model) {
        model.addAttribute("redirectBase", redirectBase);
        return "sso/register";
    }
}
