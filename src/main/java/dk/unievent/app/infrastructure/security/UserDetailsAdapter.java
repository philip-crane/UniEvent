package dk.unievent.app.infrastructure.security;

import dk.unievent.app.db.model.UserEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.List;

public class UserDetailsAdapter extends User {

    private final UserEntity userEntity;

    public UserDetailsAdapter(UserEntity user) {
        super(user.getEmail(), user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())));
        this.userEntity = user;
    }

    public UserEntity getUser() {
        return userEntity;
    }
}
