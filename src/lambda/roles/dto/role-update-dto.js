const { IsOptional, IsString, IsBoolean, Length } = require("class-validator");
const { plainToInstance } = require("class-transformer");

class RoleUpdateDto {
  @IsOptional()
  @IsString({ message: "La descripción debe ser texto." })
  @Length(10, 100, {
    message: "La descripción debe tener entre 10 y 100 caracteres.",
  })
  description;

  @IsOptional()
  @IsBoolean({ message: "El campo root debe ser verdadero o falso." })
  root;

  @IsOptional()
  @IsString({ message: "El campo created_by debe ser texto." })
  created_by;
}

function validateRoleUpdateDto(body) {
  const dto = plainToInstance(RoleUpdateDto, body);
  const { validateSync } = require("class-validator");
  const errors = validateSync(dto, { whitelist: true });
  if (errors.length > 0) {
    const detalles = errors
      .map((e) => Object.values(e.constraints))
      .flat()
      .join(" ");
    throw new Error(detalles);
  }
  return dto;
}

module.exports = { RoleUpdateDto, validateRoleUpdateDto };
