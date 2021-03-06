package io.hyperfoil.tools.repo.entity.json;

import io.hyperfoil.tools.repo.entity.converter.InstantSerializer;
import io.hyperfoil.tools.yaup.json.Json;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import io.quarkus.runtime.annotations.RegisterForReflection;
import org.hibernate.annotations.Type;

import javax.json.bind.annotation.JsonbTypeDeserializer;
import javax.json.bind.annotation.JsonbTypeSerializer;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@RegisterForReflection
public class Run extends PanacheEntityBase {

   @Id
   @SequenceGenerator(
      name = "runSequence",
      sequenceName = "run_id_seq",
      allocationSize = 1,
      initialValue = 1)
   @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "runSequence")
   public Integer id;

   @NotNull
   @Column(name="start", columnDefinition = "timestamp")
   @JsonbTypeDeserializer(InstantSerializer.class)
   @JsonbTypeSerializer(InstantSerializer.class)
   public Instant start;

   @NotNull
   @Column(name="stop", columnDefinition = "timestamp")
   @JsonbTypeDeserializer(InstantSerializer.class)
   @JsonbTypeSerializer(InstantSerializer.class)
   public Instant stop;

   @NotNull
   public Integer testId;

   @NotNull
   @Type(type = "io.hyperfoil.tools.repo.entity.converter.JsonUserType")
   public Json data;

   public String schemaUri;

   @NotNull
   public String owner;

   public String token;

   @NotNull
   public Access access = Access.PUBLIC;
}
